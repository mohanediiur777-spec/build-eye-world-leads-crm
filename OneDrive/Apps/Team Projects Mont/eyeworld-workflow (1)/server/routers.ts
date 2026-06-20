import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { eq } from "drizzle-orm";
import { comments, attachments } from "../drizzle/schema";

// ── Role helpers ──────────────────────────────────────────────────────────────
function isDirector(role?: string): boolean {
  return role === "director";
}

function isTeamMember(role?: string): boolean {
  return role === "media_buyer" || role === "designer" || role === "content_creator";
}

// New task status enum (used across router input validators)
const TASK_STATUS = z.enum(["Sent", "Seen", "In Progress", "Delivered", "Approved"]);

// ── Router ────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  workflow: router({

    // ── Get all requests (role-filtered) ──────────────────────────────────────
    getAllRequests: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        if (isDirector(ctx.user.role)) {
          const requests = await db.getAllRequests();
          return requests.map(req => ({
            ...req,
            createdAt: new Date(req.createdAt),
            updatedAt: new Date(req.updatedAt),
            deadline: req.deadline ? new Date(req.deadline) : null,
            sentAt: req.sentAt ? new Date(req.sentAt) : null,
            viewedAt: req.viewedAt ? new Date(req.viewedAt) : null,
            repliedAt: req.repliedAt ? new Date(req.repliedAt) : null,
            deliveredAt: req.deliveredAt ? new Date(req.deliveredAt) : null,
            approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
          }));
        }

        // Team members see only their assigned tasks
        const requests = await db.getRequestsByAssignee(ctx.user.id);
        return requests.map(req => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
          deadline: req.deadline ? new Date(req.deadline) : null,
          sentAt: req.sentAt ? new Date(req.sentAt) : null,
          viewedAt: req.viewedAt ? new Date(req.viewedAt) : null,
          repliedAt: req.repliedAt ? new Date(req.repliedAt) : null,
          deliveredAt: req.deliveredAt ? new Date(req.deliveredAt) : null,
          approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        }));
      }),

    // ── Get tasks assigned to current user (team member dashboard) ────────────
    getMyTasks: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Directors use getTeamMemberTasks" });
        }

        const requests = await db.getRequestsByAssignee(ctx.user.id);
        return requests.map(req => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
          deadline: req.deadline ? new Date(req.deadline) : null,
          sentAt: req.sentAt ? new Date(req.sentAt) : null,
          viewedAt: req.viewedAt ? new Date(req.viewedAt) : null,
          repliedAt: req.repliedAt ? new Date(req.repliedAt) : null,
          deliveredAt: req.deliveredAt ? new Date(req.deliveredAt) : null,
          approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        }));
      }),

    // ── Get all tasks for a specific team member (director only) ──────────────
    getTeamMemberTasks: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only directors can view team member tasks" });
        }

        const requests = await db.getRequestsByAssignee(input.userId);
        return requests.map(req => ({
          ...req,
          createdAt: new Date(req.createdAt),
          updatedAt: new Date(req.updatedAt),
          deadline: req.deadline ? new Date(req.deadline) : null,
          sentAt: req.sentAt ? new Date(req.sentAt) : null,
          viewedAt: req.viewedAt ? new Date(req.viewedAt) : null,
          repliedAt: req.repliedAt ? new Date(req.repliedAt) : null,
          deliveredAt: req.deliveredAt ? new Date(req.deliveredAt) : null,
          approvedAt: req.approvedAt ? new Date(req.approvedAt) : null,
        }));
      }),

    // ── Get team members (director only) ──────────────────────────────────────
    getTeamMembers: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only directors can view team members" });
        }
        return await db.getTeamMembers();
      }),

    // ── Get single request with all related data ──────────────────────────────
    getRequest: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.id);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        // Team members can only view tasks assigned to them
        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to view this task" });
        }

        const requestComments = await db.getCommentsByRequest(input.id);
        const requestAttachments = await db.getAttachmentsByRequest(input.id);
        const requestStatusHistory = await db.getStatusHistory(input.id);
        const submitter = request.submitterId ? await db.getUserById(request.submitterId) : null;
        const assignee = request.assignedToId ? await db.getUserById(request.assignedToId) : null;

        // Enrich comments with author info
        const authorIds = Array.from(new Set(requestComments.map(c => c.authorId)));
        const authorMap: Record<number, { id: number; name: string | null; role: string }> = {};
        for (const authorId of authorIds) {
          const author = await db.getUserById(authorId);
          if (author) {
            authorMap[authorId] = { id: author.id, name: author.name, role: author.role };
          }
        }

        return {
          ...request,
          createdAt: new Date(request.createdAt),
          updatedAt: new Date(request.updatedAt),
          deadline: request.deadline ? new Date(request.deadline) : null,
          sentAt: request.sentAt ? new Date(request.sentAt) : null,
          viewedAt: request.viewedAt ? new Date(request.viewedAt) : null,
          repliedAt: request.repliedAt ? new Date(request.repliedAt) : null,
          deliveredAt: request.deliveredAt ? new Date(request.deliveredAt) : null,
          approvedAt: request.approvedAt ? new Date(request.approvedAt) : null,
          submitter,
          assignee,
          comments: requestComments.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            author: authorMap[c.authorId] ?? null,
          })),
          attachments: requestAttachments,
          statusHistory: requestStatusHistory.map(h => ({
            ...h,
            createdAt: new Date(h.createdAt),
          })),
        };
      }),

    // ── Create a new task (director only) ─────────────────────────────────────
    createTask: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        projectName: z.string().min(1),
        description: z.string().optional(),
        assignedToId: z.number(),
        deadline: z.coerce.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only directors can create tasks" });
        }

        const result = await db.createTask({
          title: input.title,
          projectName: input.projectName,
          description: input.description,
          assignedToId: input.assignedToId,
          deadline: input.deadline,
          submitterId: ctx.user.id,
        });

        const taskId = (result as any).insertId;

        // Notify the assigned team member
        const assignee = await db.getUserById(input.assignedToId);
        if (assignee) {
          await db.createNotification({
            userId: assignee.id,
            type: "task_assigned",
            requestId: taskId,
            title: "New Task Assigned",
            message: `${ctx.user.name} assigned you a new task: "${input.title}" — Project: ${input.projectName}`,
          });
        }

        return { id: taskId };
      }),

    // ── Legacy createRequest (kept for backwards compatibility) ───────────────
    createRequest: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        materialType: z.string().min(1),
        targetAudience: z.string().optional(),
        deadline: z.coerce.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const result = await db.createRequest({
          title: input.title,
          description: input.description,
          materialType: input.materialType,
          targetAudience: input.targetAudience,
          deadline: input.deadline,
          submitterId: ctx.user.id,
        });

        const requestId = (result as any).insertId;

        await db.createNotification({
          userId: ctx.user.id,
          type: "new_request",
          requestId,
          title: "Request Created",
          message: `Your request "${input.title}" has been created.`,
        });

        return { id: requestId };
      }),

    // ── Record first view (team member) ───────────────────────────────────────
    recordViewed: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.taskId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const wasFirstView = await db.recordViewedAt(input.taskId);

        if (wasFirstView && request.submitterId) {
          // Notify the director (submitter)
          await db.createNotification({
            userId: request.submitterId,
            type: "task_viewed",
            requestId: input.taskId,
            title: "Task Viewed",
            message: `${ctx.user.name} opened your task: "${request.title}"`,
          });
        }

        return { wasFirstView };
      }),

    // ── Mark task as delivered (team member) ──────────────────────────────────
    markDelivered: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.taskId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This task is not assigned to you" });
        }
        if (isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only team members can mark tasks as delivered" });
        }

        await db.markDelivered(input.taskId);

        // Notify the director
        if (request.submitterId) {
          await db.createNotification({
            userId: request.submitterId,
            type: "task_delivered",
            requestId: input.taskId,
            title: "Task Delivered",
            message: `${ctx.user.name} marked task "${request.title}" as Delivered.`,
          });
        }

        return { success: true };
      }),

    // ── Approve task (director only) ──────────────────────────────────────────
    approveTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only directors can approve tasks" });
        }

        const request = await db.getRequestById(input.taskId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        await db.approveTask(input.taskId, ctx.user.id);

        // Notify the team member
        if (request.assignedToId) {
          await db.createNotification({
            userId: request.assignedToId,
            type: "task_approved",
            requestId: input.taskId,
            title: "Task Approved",
            message: `Your task "${request.title}" has been approved by ${ctx.user.name}.`,
          });
        }

        return { success: true };
      }),

    // ── Request changes (director only) ───────────────────────────────────────
    requestChanges: protectedProcedure
      .input(z.object({ taskId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        if (!isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only directors can request changes" });
        }

        const request = await db.getRequestById(input.taskId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        await db.requestChanges(input.taskId, ctx.user.id, input.reason);

        // Notify the team member
        if (request.assignedToId) {
          await db.createNotification({
            userId: request.assignedToId,
            type: "status_change",
            requestId: input.taskId,
            title: "Changes Requested",
            message: `${ctx.user.name} requested changes on "${request.title}".${input.reason ? ` Note: ${input.reason}` : ""}`,
          });
        }

        return { success: true };
      }),

    // ── Generic status update ──────────────────────────────────────────────────
    updateStatus: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        newStatus: TASK_STATUS,
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        // Director can update any task; team members can only update their own
        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to update this task" });
        }

        const { oldStatus } = await db.updateRequestStatus(
          input.requestId,
          input.newStatus,
          ctx.user.id,
          input.reason
        );

        // Notify the relevant party
        const notifyUserId = isDirector(ctx.user.role) ? request.assignedToId : request.submitterId;
        if (notifyUserId) {
          await db.createNotification({
            userId: notifyUserId,
            type: "status_change",
            requestId: input.requestId,
            title: `Task Status: ${input.newStatus}`,
            message: `Task "${request.title}" status changed from ${oldStatus} to ${input.newStatus}.${input.reason ? ` Reason: ${input.reason}` : ""}`,
          });
        }

        return { success: true };
      }),

    // ── Update task status (alias for above) ──────────────────────────────────
    updateTaskStatus: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        newStatus: TASK_STATUS,
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.taskId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const { oldStatus } = await db.updateRequestStatus(
          input.taskId,
          input.newStatus,
          ctx.user.id,
          input.reason
        );

        const notifyUserId = isDirector(ctx.user.role) ? request.assignedToId : request.submitterId;
        if (notifyUserId) {
          await db.createNotification({
            userId: notifyUserId,
            type: "status_change",
            requestId: input.taskId,
            title: `Task Status: ${input.newStatus}`,
            message: `Task "${request.title}" status changed to ${input.newStatus}.`,
          });
        }

        return { success: true };
      }),

    // ── Add a comment / reply ─────────────────────────────────────────────────
    addComment: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        content: z.string().min(1),
        parentCommentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        // Access check
        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const result = await db.createComment({
          requestId: input.requestId,
          authorId: ctx.user.id,
          content: input.content,
          parentCommentId: input.parentCommentId,
        });

        // Record first reply timestamp if this is the team member replying
        if (isTeamMember(ctx.user.role)) {
          await db.recordRepliedAt(input.requestId);
        }

        // Notify the other party
        let notifyUserId: number | null | undefined = null;
        if (isDirector(ctx.user.role)) {
          // Director replied → notify team member
          notifyUserId = request.assignedToId;
        } else {
          // Team member replied → notify director (submitter)
          notifyUserId = request.submitterId;
        }

        if (notifyUserId) {
          await db.createNotification({
            userId: notifyUserId,
            type: "comment_reply",
            requestId: input.requestId,
            title: "New Reply",
            message: `${ctx.user.name} replied on "${request.title}": "${input.content.substring(0, 100)}${input.content.length > 100 ? "..." : ""}"`,
          });
        }

        return { id: (result as any).insertId };
      }),

    // ── Update a comment ──────────────────────────────────────────────────────
    updateComment: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await dbInstance.select().from(comments).where(eq(comments.id, input.commentId)).limit(1);

        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
        }

        if (result[0].authorId !== ctx.user.id && !isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own comments" });
        }

        await db.updateComment(input.commentId, input.content);
        return { success: true };
      }),

    // ── Delete a comment ──────────────────────────────────────────────────────
    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await dbInstance.select().from(comments).where(eq(comments.id, input.commentId)).limit(1);
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
        }

        if (result[0].authorId !== ctx.user.id && !isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own comments" });
        }

        await db.deleteComment(input.commentId);
        return { success: true };
      }),

    // ── Get attachments for a request ─────────────────────────────────────────
    getAttachments: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .query(async ({ input }) => {
        const requestAttachments = await db.getAttachmentsByRequest(input.requestId);
        return requestAttachments.map(a => ({
          ...a,
          createdAt: new Date(a.createdAt),
        }));
      }),

    // ── Create attachment record (metadata only) ──────────────────────────────
    createAttachment: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        storageKey: z.string(),
        storageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const result = await db.createAttachment({
          requestId: input.requestId,
          uploadedBy: ctx.user.id,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          storageKey: input.storageKey,
          storageUrl: input.storageUrl,
        });

        return { id: (result as any).insertId };
      }),

    // ── Delete attachment ─────────────────────────────────────────────────────
    deleteAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await dbInstance.select().from(attachments).where(eq(attachments.id, input.attachmentId)).limit(1);
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" });
        }

        if (result[0].uploadedBy !== ctx.user.id && !isDirector(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own attachments" });
        }

        await db.deleteAttachment(input.attachmentId);
        return { success: true };
      }),

    // ── Upload file to S3 ─────────────────────────────────────────────────────
    uploadFile: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        fileName: z.string(),
        fileContent: z.instanceof(Uint8Array),
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const request = await db.getRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        // Director or the assigned team member can upload
        if (isTeamMember(ctx.user.role) && request.assignedToId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to upload files to this task" });
        }

        try {
          const { storagePut } = await import("./storage");
          const storageKey = `requests/${input.requestId}/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(storageKey, input.fileContent, input.mimeType);

          const result = await db.createAttachment({
            requestId: input.requestId,
            uploadedBy: ctx.user.id,
            fileName: input.fileName,
            fileSize: input.fileContent.length,
            mimeType: input.mimeType,
            storageKey,
            storageUrl: url,
          });

          // Record first reply if team member is uploading
          if (isTeamMember(ctx.user.role)) {
            await db.recordRepliedAt(input.requestId);
          }

          return { id: (result as any).insertId, url };
        } catch (error) {
          console.error("File upload error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload file" });
        }
      }),

    // ── Legacy: get notifications for current user ────────────────────────────
    getNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const userNotifications = await db.getNotificationsByUser(ctx.user.id);
        return userNotifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }),

    // ── Legacy: mark single notification as read ──────────────────────────────
    markNotificationAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),

  // ── Notifications sub-router ──────────────────────────────────────────────
  notifications: router({

    // Get recent notifications (last 4 days)
    getRecent: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const recentNotifications = await db.getRecentNotificationsByUser(ctx.user.id);
        return recentNotifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }),

    // Mark single notification as read
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    // Mark all notifications as read
    markAllRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await db.markAllNotificationsAsRead(ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
