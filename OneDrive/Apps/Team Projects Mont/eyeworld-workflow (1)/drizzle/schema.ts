import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["director", "media_buyer", "designer", "content_creator"]).default("media_buyer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Marketing requests / tasks table - core entity for the workflow
 */
export const requests = mysqlTable("requests", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  projectName: varchar("projectName", { length: 255 }).notNull().default(""),
  materialType: varchar("materialType", { length: 100 }).notNull().default(""),
  targetAudience: varchar("targetAudience", { length: 255 }),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["Sent", "Seen", "In Progress", "Delivered", "Approved"]).default("Sent").notNull(),
  submitterId: int("submitterId").notNull(),       // The director who created/assigned the task
  assignedToId: int("assignedToId"),               // The team member the task is assigned to
  assignedReviewerId: int("assignedReviewerId"),   // Kept for backwards compatibility
  rejectionReason: longtext("rejectionReason"),
  // Lifecycle timestamps
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  repliedAt: timestamp("repliedAt"),
  deliveredAt: timestamp("deliveredAt"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

/**
 * Status history table - audit trail for all status changes
 */
export const statusHistory = mysqlTable("statusHistory", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  changedBy: int("changedBy").notNull(),
  reason: longtext("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StatusHistory = typeof statusHistory.$inferSelect;
export type InsertStatusHistory = typeof statusHistory.$inferInsert;

/**
 * Comments table - threaded discussion on requests
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  authorId: int("authorId").notNull(),
  content: longtext("content").notNull(),
  parentCommentId: int("parentCommentId"), // For threading
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Attachments table - file references for requests
 */
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  storageKey: varchar("storageKey", { length: 500 }).notNull(), // S3 key
  storageUrl: varchar("storageUrl", { length: 1000 }), // Presigned URL or direct path
  // S3 auto-deletion fields
  scheduledDeleteAt: timestamp("scheduledDeleteAt"),  // approvedAt + 5 days
  deletedAt: timestamp("deletedAt"),                  // when S3 file was actually deleted
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

/**
 * Notifications table - track in-app notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "status_change",
    "new_request",
    "comment_mention",
    "comment_reply",
    "task_assigned",
    "task_viewed",
    "task_replied",
    "task_delivered",
    "task_approved",
  ]).notNull(),
  requestId: int("requestId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: longtext("message"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
