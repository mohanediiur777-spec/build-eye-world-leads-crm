import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getAllRequests: vi.fn(),
  getRequestById: vi.fn(),
  createRequest: vi.fn(),
  updateRequestStatus: vi.fn(),
  createComment: vi.fn(),
  getCommentsByRequest: vi.fn(),
  getUserById: vi.fn(),
  getStatusHistory: vi.fn(),
  createNotification: vi.fn(),
}));

function createMockContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

const mockUser: User = {
  id: 1,
  openId: "test-user-1",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockAdmin: User = {
  ...mockUser,
  id: 2,
  openId: "admin-user",
  role: "admin",
};

describe("workflow router", () => {
  describe("getAllRequests", () => {
    it("should return empty array when no requests exist", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      // Mock the database to return empty array
      const { getAllRequests } = await import("./db");
      vi.mocked(getAllRequests).mockResolvedValueOnce([]);

      const result = await caller.workflow.getAllRequests();
      expect(result).toEqual([]);
    });

    it("should require authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.workflow.getAllRequests();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("createRequest", () => {
    it("should create a request with required fields", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const { createRequest } = await import("./db");
      vi.mocked(createRequest).mockResolvedValueOnce({ insertId: 1 } as any);

      const result = await caller.workflow.createRequest({
        title: "Test Campaign",
        materialType: "Email Campaign",
      });

      expect(result).toEqual({ id: 1 });
    });

    it("should require authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.workflow.createRequest({
          title: "Test",
          materialType: "Email",
        });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should validate required title field", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.workflow.createRequest({
          title: "",
          materialType: "Email",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("updateStatus", () => {
    it("should update request status for admin", async () => {
      const ctx = createMockContext(mockAdmin);
      const caller = appRouter.createCaller(ctx);

      const { getRequestById, updateRequestStatus } = await import("./db");
      vi.mocked(getRequestById).mockResolvedValueOnce({
        id: 1,
        title: "Test",
        status: "Pending",
        submitterId: 1,
        materialType: "Email",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        targetAudience: null,
        deadline: null,
        assignedReviewerId: null,
        rejectionReason: null,
      });

      vi.mocked(updateRequestStatus).mockResolvedValueOnce({
        oldStatus: "Pending",
        newStatus: "Approved",
      });

      const result = await caller.workflow.updateStatus({
        requestId: 1,
        newStatus: "Approved",
      });

      expect(result).toEqual({ success: true });
    });

    it("should allow submitter to update their own request status", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const { getRequestById, updateRequestStatus } = await import("./db");
      vi.mocked(getRequestById).mockResolvedValueOnce({
        id: 1,
        title: "Test",
        status: "Pending",
        submitterId: mockUser.id,
        materialType: "Email",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        targetAudience: null,
        deadline: null,
        assignedReviewerId: null,
        rejectionReason: null,
      });

      vi.mocked(updateRequestStatus).mockResolvedValueOnce({
        oldStatus: "Pending",
        newStatus: "In Review",
      });

      const result = await caller.workflow.updateStatus({
        requestId: 1,
        newStatus: "In Review",
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject non-admin/non-reviewer updating others' requests", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const { getRequestById } = await import("./db");
      vi.mocked(getRequestById).mockResolvedValueOnce({
        id: 1,
        title: "Test",
        status: "Pending",
        submitterId: 999, // Different user
        materialType: "Email",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        targetAudience: null,
        deadline: null,
        assignedReviewerId: null,
        rejectionReason: null,
      });

      try {
        await caller.workflow.updateStatus({
          requestId: 1,
          newStatus: "Approved",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("addComment", () => {
    it("should add a comment to a request", async () => {
      const ctx = createMockContext(mockUser);
      const caller = appRouter.createCaller(ctx);

      const { getRequestById, createComment } = await import("./db");
      vi.mocked(getRequestById).mockResolvedValueOnce({
        id: 1,
        title: "Test",
        status: "Pending",
        submitterId: 1,
        materialType: "Email",
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        targetAudience: null,
        deadline: null,
        assignedReviewerId: null,
        rejectionReason: null,
      });

      vi.mocked(createComment).mockResolvedValueOnce({ insertId: 1 } as any);

      const result = await caller.workflow.addComment({
        requestId: 1,
        content: "This looks good!",
      });

      expect(result).toEqual({ id: 1 });
    });

    it("should require authentication", async () => {
      const ctx = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.workflow.addComment({
          requestId: 1,
          content: "Test comment",
        });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
