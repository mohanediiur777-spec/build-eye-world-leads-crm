import { eq, desc, and, or, lte, isNull, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, requests, comments, statusHistory, attachments, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'director';
      updateSet.role = 'director';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(users.name);
}

export async function getTeamMembers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(
    sql`${users.role} IN ('media_buyer', 'designer', 'content_creator')`
  );
}

// Request queries
export async function getAllRequests() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(requests).orderBy(desc(requests.createdAt));
}

export async function getRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRequestsBySubmitter(submitterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(requests)
    .where(eq(requests.submitterId, submitterId))
    .orderBy(desc(requests.createdAt));
}

export async function getRequestsByAssignee(assignedToId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(requests)
    .where(eq(requests.assignedToId, assignedToId))
    .orderBy(desc(requests.createdAt));
}

export async function getRequestsByStatus(status: "Sent" | "Seen" | "In Progress" | "Delivered" | "Approved") {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(requests)
    .where(eq(requests.status, status))
    .orderBy(desc(requests.createdAt));
}

export async function createTask(data: {
  title: string;
  description?: string;
  projectName: string;
  materialType?: string;
  targetAudience?: string;
  deadline?: Date;
  submitterId: number;
  assignedToId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const result = await db.insert(requests).values({
    title: data.title,
    description: data.description,
    projectName: data.projectName,
    materialType: data.materialType ?? "Task",
    targetAudience: data.targetAudience,
    deadline: data.deadline,
    submitterId: data.submitterId,
    assignedToId: data.assignedToId,
    status: "Sent",
    sentAt: now,
  });

  return result;
}

// Keep old createRequest for backwards compatibility
export async function createRequest(data: {
  title: string;
  description?: string;
  materialType: string;
  targetAudience?: string;
  deadline?: Date;
  submitterId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(requests).values({
    title: data.title,
    description: data.description,
    materialType: data.materialType,
    targetAudience: data.targetAudience,
    deadline: data.deadline,
    submitterId: data.submitterId,
    status: "Sent",
    sentAt: new Date(),
  });

  return result;
}

export async function updateRequestStatus(
  requestId: number,
  newStatus: "Sent" | "Seen" | "In Progress" | "Delivered" | "Approved",
  changedBy: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const oldStatus = request.status;
  const now = new Date();

  // Build timestamp updates based on status transition
  const timestampUpdates: Record<string, Date | null> = {};
  if (newStatus === "Seen" && !request.viewedAt) {
    timestampUpdates.viewedAt = now;
  }
  if (newStatus === "Delivered" && !request.deliveredAt) {
    timestampUpdates.deliveredAt = now;
  }
  if (newStatus === "Approved" && !request.approvedAt) {
    timestampUpdates.approvedAt = now;
  }
  if (newStatus === "In Progress" && !request.repliedAt) {
    timestampUpdates.repliedAt = now;
  }

  // Update request status
  await db.update(requests)
    .set({ status: newStatus, updatedAt: now, ...timestampUpdates })
    .where(eq(requests.id, requestId));

  // Record status change in history
  await db.insert(statusHistory).values({
    requestId,
    oldStatus,
    newStatus,
    changedBy,
    reason,
  });

  // If approved, schedule attachment deletion (approvedAt + 5 days)
  if (newStatus === "Approved") {
    const deleteAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    await db.update(attachments)
      .set({ scheduledDeleteAt: deleteAt })
      .where(and(eq(attachments.requestId, requestId), eq(attachments.isDeleted, false)));
  }

  return { oldStatus, newStatus };
}

export async function recordViewedAt(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  if (!request.viewedAt) {
    await db.update(requests)
      .set({ viewedAt: new Date(), status: request.status === "Sent" ? "Seen" : request.status, updatedAt: new Date() })
      .where(eq(requests.id, requestId));
    return true; // was first view
  }
  return false; // already viewed
}

export async function recordRepliedAt(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  if (!request.repliedAt) {
    await db.update(requests)
      .set({ repliedAt: new Date(), updatedAt: new Date() })
      .where(eq(requests.id, requestId));
    return true; // was first reply
  }
  return false;
}

export async function markDelivered(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const oldStatus = request.status;
  const now = new Date();

  await db.update(requests)
    .set({ status: "Delivered", deliveredAt: now, updatedAt: now })
    .where(eq(requests.id, requestId));

  await db.insert(statusHistory).values({
    requestId,
    oldStatus,
    newStatus: "Delivered",
    changedBy: request.assignedToId ?? request.submitterId,
  });
}

export async function approveTask(requestId: number, directorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const oldStatus = request.status;
  const now = new Date();
  const deleteAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  await db.update(requests)
    .set({ status: "Approved", approvedAt: now, updatedAt: now })
    .where(eq(requests.id, requestId));

  await db.insert(statusHistory).values({
    requestId,
    oldStatus,
    newStatus: "Approved",
    changedBy: directorId,
  });

  // Schedule S3 deletion for all attachments of this task
  await db.update(attachments)
    .set({ scheduledDeleteAt: deleteAt })
    .where(and(eq(attachments.requestId, requestId), eq(attachments.isDeleted, false)));
}

export async function requestChanges(requestId: number, directorId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  const oldStatus = request.status;
  const now = new Date();

  await db.update(requests)
    .set({ status: "In Progress", updatedAt: now })
    .where(eq(requests.id, requestId));

  await db.insert(statusHistory).values({
    requestId,
    oldStatus,
    newStatus: "In Progress",
    changedBy: directorId,
    reason,
  });
}

export async function updateRequestRejection(requestId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(requests)
    .set({ rejectionReason: reason, updatedAt: new Date() })
    .where(eq(requests.id, requestId));
}

// Comment queries
export async function getCommentsByRequest(requestId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(comments)
    .where(eq(comments.requestId, requestId))
    .orderBy(comments.createdAt);
}

export async function createComment(data: {
  requestId: number;
  authorId: number;
  content: string;
  parentCommentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values({
    requestId: data.requestId,
    authorId: data.authorId,
    content: data.content,
    parentCommentId: data.parentCommentId,
  });

  return result;
}

export async function updateComment(commentId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(comments)
    .set({ content, updatedAt: new Date() })
    .where(eq(comments.id, commentId));
}

export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(comments).where(eq(comments.id, commentId));
}

// Attachment queries
export async function getAttachmentsByRequest(requestId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(attachments)
    .where(eq(attachments.requestId, requestId))
    .orderBy(desc(attachments.createdAt));
}

export async function createAttachment(data: {
  requestId: number;
  uploadedBy: number;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  storageKey: string;
  storageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attachments).values(data);
  return result;
}

export async function deleteAttachment(attachmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(attachments).where(eq(attachments.id, attachmentId));
}

export async function markAttachmentDeleted(attachmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(attachments)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(eq(attachments.id, attachmentId));
}

export async function getPendingDeletionAttachments() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select().from(attachments)
    .where(and(
      lte(attachments.scheduledDeleteAt, now),
      eq(attachments.isDeleted, false),
    ));
}

// Notification queries
export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getRecentNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  return await db.select().from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      gte(notifications.createdAt, fourDaysAgo),
    ))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: {
  userId: number;
  type: "status_change" | "new_request" | "comment_mention" | "comment_reply" | "task_assigned" | "task_viewed" | "task_replied" | "task_delivered" | "task_approved";
  requestId?: number;
  title: string;
  message?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    requestId: data.requestId,
    title: data.title,
    message: data.message,
  });

  return result;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function getStatusHistory(requestId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(statusHistory)
    .where(eq(statusHistory.requestId, requestId))
    .orderBy(desc(statusHistory.createdAt));
}
