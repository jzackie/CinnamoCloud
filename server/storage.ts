import { users, folders, files, achievements, userAchievements, type User, type InsertUser, type Folder, type InsertFolder, type File, type InsertFile, type UpdateUser, type Achievement, type UserAchievement, type InsertUserAchievement } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, isNotNull, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  updateUserResetKey(id: number, resetKey: string): Promise<void>;
  validateResetKey(resetKey: string): Promise<User | undefined>;
  
  // Folder operations  
  getUserFolders(userId: number, parentId?: number): Promise<Folder[]>;
  createFolder(userId: number, folder: InsertFolder): Promise<Folder>;
  deleteFolder(id: number, userId: number): Promise<void>;
  restoreFolder(id: number, userId: number): Promise<void>;
  getFolder(id: number, userId: number): Promise<Folder | undefined>;
  
  // File operations
  getUserFiles(userId: number, folderId?: number): Promise<File[]>;
  getFavoriteFiles(userId: number): Promise<File[]>;
  getDeletedFiles(userId: number): Promise<File[]>;
  getFilesByType(userId: number, mimeType: string): Promise<File[]>;
  createFile(userId: number, file: InsertFile): Promise<File>;
  getFile(id: number, userId: number): Promise<File | undefined>;
  toggleFileFavorite(id: number, userId: number): Promise<void>;
  deleteFile(id: number, userId: number): Promise<void>;
  restoreFile(id: number, userId: number): Promise<void>;
  permanentlyDeleteFile(id: number, userId: number): Promise<void>;
  
  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]>;
  updateUserProgress(userId: number, achievementKey: string, progress: number): Promise<void>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const resetKey = this.generateResetKey();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, currentResetKey: resetKey })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserResetKey(id: number, resetKey: string): Promise<void> {
    await db
      .update(users)
      .set({ currentResetKey: resetKey })
      .where(eq(users.id, id));
  }

  async validateResetKey(resetKey: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.currentResetKey, resetKey));
    return user || undefined;
  }

  // Folder operations
  async getUserFolders(userId: number, parentId?: number): Promise<Folder[]> {
    const condition = parentId 
      ? and(eq(folders.userId, userId), eq(folders.parentId, parentId), eq(folders.isDeleted, false))
      : and(eq(folders.userId, userId), isNull(folders.parentId), eq(folders.isDeleted, false));
    
    return await db.select().from(folders).where(condition);
  }

  async createFolder(userId: number, folder: InsertFolder): Promise<Folder> {
    const [newFolder] = await db
      .insert(folders)
      .values({ ...folder, userId })
      .returning();
    return newFolder;
  }

  async deleteFolder(id: number, userId: number): Promise<void> {
    await db
      .update(folders)
      .set({ isDeleted: true })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  async restoreFolder(id: number, userId: number): Promise<void> {
    await db
      .update(folders)
      .set({ isDeleted: false })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  async getFolder(id: number, userId: number): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return folder || undefined;
  }

  // File operations
  async getUserFiles(userId: number, folderId?: number): Promise<File[]> {
    const condition = folderId 
      ? and(eq(files.userId, userId), eq(files.folderId, folderId), eq(files.isDeleted, false))
      : and(eq(files.userId, userId), isNull(files.folderId), eq(files.isDeleted, false));
    
    return await db.select().from(files).where(condition);
  }

  async getFavoriteFiles(userId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isFavorite, true), eq(files.isDeleted, false)));
  }

  async getDeletedFiles(userId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isDeleted, true)));
  }

  async getFilesByType(userId: number, mimeType: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.mimeType, mimeType), eq(files.isDeleted, false)));
  }

  async createFile(userId: number, file: InsertFile): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values({ ...file, userId })
      .returning();
    return newFile;
  }

  async getFile(id: number, userId: number): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)));
    return file || undefined;
  }

  async toggleFileFavorite(id: number, userId: number): Promise<void> {
    const file = await this.getFile(id, userId);
    if (file) {
      await db
        .update(files)
        .set({ isFavorite: !file.isFavorite })
        .where(and(eq(files.id, id), eq(files.userId, userId)));
    }
  }

  async deleteFile(id: number, userId: number): Promise<void> {
    await db
      .update(files)
      .set({ isDeleted: true })
      .where(and(eq(files.id, id), eq(files.userId, userId)));
  }

  async restoreFile(id: number, userId: number): Promise<void> {
    await db
      .update(files)
      .set({ isDeleted: false })
      .where(and(eq(files.id, id), eq(files.userId, userId)));
  }

  async permanentlyDeleteFile(id: number, userId: number): Promise<void> {
    await db
      .delete(files)
      .where(and(eq(files.id, id), eq(files.userId, userId)));
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];
    
    // Get user stats
    const [fileCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isDeleted, false)));

    const [folderCount] = await db
      .select({ count: count() })
      .from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.isDeleted, false)));

    const [favoriteCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isFavorite, true), eq(files.isDeleted, false)));

    const [imageCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.userId, userId), sql`mime_type LIKE 'image/%'`, eq(files.isDeleted, false)));

    const [videoCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.userId, userId), sql`mime_type LIKE 'video/%'`, eq(files.isDeleted, false)));

    const [docCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.userId, userId), sql`mime_type LIKE '%document%' OR mime_type LIKE '%pdf%'`, eq(files.isDeleted, false)));

    // Check all achievements
    const allAchievements = await this.getAchievements();
    const userUnlockedAchievements = await this.getUserAchievements(userId);
    const unlockedKeys = userUnlockedAchievements.map(ua => ua.achievementId);

    for (const achievement of allAchievements) {
      if (unlockedKeys.includes(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.key) {
        case 'first_upload':
        case 'file_collector':
        case 'storage_master':
          shouldUnlock = fileCount.count >= achievement.requirement;
          break;
        case 'organizer':
        case 'folder_architect':
          shouldUnlock = folderCount.count >= achievement.requirement;
          break;
        case 'favorite_finder':
        case 'star_collector':
          shouldUnlock = favoriteCount.count >= achievement.requirement;
          break;
        case 'image_lover':
          shouldUnlock = imageCount.count >= achievement.requirement;
          break;
        case 'video_enthusiast':
          shouldUnlock = videoCount.count >= achievement.requirement;
          break;
        case 'document_keeper':
          shouldUnlock = docCount.count >= achievement.requirement;
          break;
        case 'early_adopter':
          shouldUnlock = true; // Unlocked on account creation
          break;
        case 'nested_genius':
          // Check if user has nested folders
          const nestedFolders = await db
            .select({ count: count() })
            .from(folders)
            .where(and(eq(folders.userId, userId), isNotNull(folders.parentId)));
          shouldUnlock = nestedFolders[0].count > 0;
          break;
      }

      if (shouldUnlock) {
        const [newUserAchievement] = await db
          .insert(userAchievements)
          .values({
            userId,
            achievementId: achievement.id,
            progress: achievement.requirement
          })
          .returning();
        
        newAchievements.push(newUserAchievement);
      }
    }

    return newAchievements;
  }

  async updateUserProgress(userId: number, achievementKey: string, progress: number): Promise<void> {
    const achievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.key, achievementKey))
      .limit(1);

    if (achievement.length === 0) return;

    const existingProgress = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement[0].id)))
      .limit(1);

    if (existingProgress.length === 0) {
      await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId: achievement[0].id,
          progress
        });
    } else {
      await db
        .update(userAchievements)
        .set({ progress })
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement[0].id)));
    }
  }

  private generateResetKey(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
}

export const storage = new DatabaseStorage();
