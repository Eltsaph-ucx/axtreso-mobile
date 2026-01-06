import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(user?: any): TrpcContext {
  return {
    user: user || null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("AXTRESO Application Tests", () => {
  describe("Authentication", () => {
    it("should have auth router with required procedures", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.auth).toBeDefined();
      expect(caller.auth.me).toBeDefined();
      expect(caller.auth.logout).toBeDefined();
      expect(caller.auth.registerManager).toBeDefined();
      expect(caller.auth.loginManager).toBeDefined();
    });
  });

  describe("Salon Management", () => {
    it("should have salon router with required procedures", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.salon).toBeDefined();
      expect(caller.salon.getMysalon).toBeDefined();
      expect(caller.salon.getAllSalons).toBeDefined();
      expect(caller.salon.toggleSalonStatus).toBeDefined();
      expect(caller.salon.resetSalonPassword).toBeDefined();
      expect(caller.salon.deleteSalon).toBeDefined();
    });
  });

  describe("Transaction Management", () => {
    it("should have transaction router with required procedures", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.transaction).toBeDefined();
      expect(caller.transaction.create).toBeDefined();
      expect(caller.transaction.getBySalon).toBeDefined();
      expect(caller.transaction.getById).toBeDefined();
      expect(caller.transaction.update).toBeDefined();
      expect(caller.transaction.delete).toBeDefined();
    });
  });

  describe("Report Management", () => {
    it("should have report router with required procedures", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.report).toBeDefined();
      expect(caller.report.getReportsBySalon).toBeDefined();
      expect(caller.report.getReportById).toBeDefined();
      expect(caller.report.deleteReport).toBeDefined();
    });
  });

  describe("Notification Management", () => {
    it("should have notification router with required procedures", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.notification).toBeDefined();
      expect(caller.notification.getSettings).toBeDefined();
      expect(caller.notification.updateSettings).toBeDefined();
    });
  });

  describe("System", () => {
    it("should have system router", () => {
      const caller = appRouter.createCaller(createMockContext());
      expect(caller.system).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("should reject unauthenticated access to protected routes", async () => {
      const caller = appRouter.createCaller(createMockContext());

      try {
        await caller.salon.getMysalon();
        expect.fail("Should have thrown UNAUTHORIZED");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should reject non-admin access to admin routes", async () => {
      const mockUser = {
        id: 1,
        openId: "test-user",
        email: "manager@salon.com",
        name: "Manager",
        role: "manager" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const caller = appRouter.createCaller(createMockContext(mockUser));

      try {
        await caller.salon.getAllSalons();
        expect.fail("Should have thrown FORBIDDEN");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Logout", () => {
    it("should clear session on logout", async () => {
      const mockUser = {
        id: 1,
        openId: "test-user",
        email: "manager@salon.com",
        name: "Manager",
        role: "manager" as const,
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const clearedCookies: any[] = [];
      const ctx = createMockContext(mockUser);
      ctx.res.clearCookie = (name: string, options: any) => {
        clearedCookies.push({ name, options });
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();

      expect(result).toHaveProperty("success", true);
      expect(clearedCookies.length).toBeGreaterThan(0);
    });
  });
});
