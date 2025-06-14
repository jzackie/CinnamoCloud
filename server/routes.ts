import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertFolderSchema, insertFileSchema, updateUserSchema, resetPasswordSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, req.user!.id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function generateResetKey(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Middleware to ensure authentication
  function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  // Download reset key
  app.get("/api/download-reset-key", requireAuth, (req, res) => {
    const user = req.user!;
    const resetKeyData = {
      username: user.username,
      resetKey: user.currentResetKey,
      generatedAt: new Date().toISOString(),
      warning: "Keep this file safe! It's the only way to reset your password."
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${user.username}-reset-key.json"`);
    res.json(resetKeyData);
  });

  // Reset password with reset key
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { resetKey, newPassword } = resetPasswordSchema.parse(req.body);
      
      const user = await storage.validateResetKey(resetKey);
      if (!user) {
        return res.status(400).json({ message: "Invalid reset key" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const newResetKey = generateResetKey();
      
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.updateUserResetKey(user.id, newResetKey);

      const updatedUser = await storage.getUser(user.id);
      res.json({ 
        message: "Password reset successfully",
        newResetKey: updatedUser!.currentResetKey
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User profile operations
  app.get("/api/profile", requireAuth, (req, res) => {
    const user = req.user!;
    const { password, currentResetKey, ...safeUser } = user;
    res.json(safeUser);
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const updates = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user!.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, currentResetKey, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/profile/picture", requireAuth, upload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No profile picture uploaded" });
      }

      const profilePictureUrl = `/uploads/${req.user!.id}/${req.file.filename}`;
      const updatedUser = await storage.updateUser(req.user!.id, { 
        profilePicture: profilePictureUrl 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, currentResetKey, ...safeUser } = updatedUser;
      res.json({ profilePicture: profilePictureUrl, user: safeUser });
    } catch (error) {
      res.status(400).json({ message: "Profile picture upload failed" });
    }
  });

  // Folder operations
  app.get("/api/folders", requireAuth, async (req, res) => {
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const folders = await storage.getUserFolders(req.user!.id, parentId);
    res.json(folders);
  });

  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      // Add parentId from request body if provided
      const folderWithParent = {
        ...folderData,
        parentId: req.body.parentId ? parseInt(req.body.parentId) : undefined
      };
      const folder = await storage.createFolder(req.user!.id, folderWithParent);
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  app.get("/api/folders/:id", requireAuth, async (req, res) => {
    const folder = await storage.getFolder(parseInt(req.params.id), req.user!.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.json(folder);
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    await storage.deleteFolder(parseInt(req.params.id), req.user!.id);
    res.json({ message: "Folder moved to trash" });
  });

  app.post("/api/folders/:id/restore", requireAuth, async (req, res) => {
    await storage.restoreFolder(parseInt(req.params.id), req.user!.id);
    res.json({ message: "Folder restored" });
  });

  // File operations - specific routes first to avoid conflicts
  app.get("/api/files/favorites", requireAuth, async (req, res) => {
    const files = await storage.getFavoriteFiles(req.user!.id);
    res.json(files);
  });

  app.get("/api/files/deleted", requireAuth, async (req, res) => {
    const files = await storage.getDeletedFiles(req.user!.id);
    res.json(files);
  });

  app.get("/api/files", requireAuth, async (req, res) => {
    const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : undefined;
    const category = req.query.category as string;
    
    let files;
    if (category === 'favorites') {
      files = await storage.getFavoriteFiles(req.user!.id);
    } else if (category === 'trash') {
      files = await storage.getDeletedFiles(req.user!.id);
    } else if (category === 'images') {
      files = await storage.getFilesByType(req.user!.id, 'image/');
    } else if (category === 'videos') {
      files = await storage.getFilesByType(req.user!.id, 'video/');
    } else if (category === 'documents') {
      files = await storage.getFilesByType(req.user!.id, 'application/');
    } else {
      files = await storage.getUserFiles(req.user!.id, folderId);
    }
    
    res.json(files);
  });

  app.post("/api/files", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = {
        name: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        folderId: req.body.folderId ? parseInt(req.body.folderId) : undefined
      };

      const file = await storage.createFile(req.user!.id, fileData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ message: "File upload failed" });
    }
  });

  app.get("/api/files/:id", requireAuth, async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }
    const file = await storage.getFile(fileId, req.user!.id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    res.json(file);
  });

  app.get("/api/files/:id/preview", requireAuth, async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }
    const file = await storage.getFile(fileId, req.user!.id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: "File not found on disk" });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(path.resolve(file.path));
  });

  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    const file = await storage.getFile(parseInt(req.params.id), req.user!.id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: "File not found on disk" });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.sendFile(path.resolve(file.path));
  });

  app.post("/api/files/:id/favorite", requireAuth, async (req, res) => {
    await storage.toggleFileFavorite(parseInt(req.params.id), req.user!.id);
    res.json({ message: "File favorite status toggled" });
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    await storage.deleteFile(parseInt(req.params.id), req.user!.id);
    res.json({ message: "File moved to trash" });
  });

  app.post("/api/files/:id/restore", requireAuth, async (req, res) => {
    await storage.restoreFile(parseInt(req.params.id), req.user!.id);
    res.json({ message: "File restored" });
  });

  app.delete("/api/files/:id/permanent", requireAuth, async (req, res) => {
    const file = await storage.getFile(parseInt(req.params.id), req.user!.id);
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    await storage.permanentlyDeleteFile(parseInt(req.params.id), req.user!.id);
    res.json({ message: "File permanently deleted" });
  });



  const httpServer = createServer(app);
  return httpServer;
}
