import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  profilePicture: text("profile_picture"),
  currentResetKey: text("current_reset_key").notNull(),
  language: text("language").default("en").notNull(),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const folders: any = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  parentId: integer("parent_id").references((): any => folders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  folderId: integer("folder_id").references(() => folders.id),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: text("category").notNull(), // storage, organization, activity, special
  requirement: integer("requirement").notNull(), // threshold value
  points: integer("points").notNull().default(10), // points awarded for achievement
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  progress: integer("progress").default(0).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  folders: many(folders),
  userAchievements: many(userAchievements),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  children: many(folders),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  parentId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  originalName: true,
  mimeType: true,
  size: true,
  path: true,
  folderId: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  profilePicture: true,
  language: true,
  preferences: true,
  password: true,
}).partial();

export const resetPasswordSchema = z.object({
  resetKey: z.string().min(1),
  newPassword: z.string().min(6),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  key: true,
  name: true,
  description: true,
  icon: true,
  category: true,
  requirement: true,
  isHidden: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
