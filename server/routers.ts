import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// ============= AUTH ROUTER =============

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // Manager registration with email/password
  registerManager: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      salonName: z.string().min(2),
      city: z.enum(["Libreville", "Brazzaville"]),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Create user
      await db.upsertUser({
        email: input.email,
        passwordHash,
        name: input.salonName,
        loginMethod: "email",
        role: "manager",
      });

      const user = await db.getUserByEmail(input.email);
      if (!user) throw new Error("Failed to create user");

      // Create salon
      await db.createSalon({
        managerId: user.id,
        name: input.salonName,
        city: input.city,
        phone: input.phone,
      });

      // Create default notification settings
      const salon = (await db.getSalonsByManager(user.id))[0];
      if (salon) {
        await db.createOrUpdateNotificationSettings(salon.id, {
          dailyReminder: true,
          inactivityAlert: true,
          reportNotification: true,
        });
      }

      return { success: true, userId: user.id };
    }),

  // Manager login with email/password
  loginManager: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Update last signed in
      await db.upsertUser({
        email: user.email,
        lastSignedIn: new Date(),
      });

      return { success: true, userId: user.id };
    }),
});

// ============= SALON ROUTER =============

const salonRouter = router({
  getMysalon: protectedProcedure
    .query(async ({ ctx }) => {
      const salons = await db.getSalonsByManager(ctx.user.id);
      return salons.length > 0 ? salons[0] : null;
    }),

  updateSalon: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      name: z.string().optional(),
      city: z.enum(["Libreville", "Brazzaville"]).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input.salonId);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateSalon(input.salonId, {
        name: input.name,
        city: input.city,
        email: input.email,
        phone: input.phone,
      });

      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await db.upsertUser({
        email: user.email,
        passwordHash: newHash,
      });

      return { success: true };
    }),

  // Admin endpoints
  getAllSalons: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getAllSalons();
    }),

  getSalonById: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getSalonById(input);
    }),

  toggleSalonStatus: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      status: z.enum(["active", "inactive"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateSalon(input.salonId, { status: input.status });
      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input.salonId,
        action: `salon_status_changed_to_${input.status}`,
      });

      return { success: true };
    }),

  resetSalonPassword: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const salon = await db.getSalonById(input.salonId);
      if (!salon) throw new TRPCError({ code: "NOT_FOUND" });

      const manager = await db.getUserById(salon.managerId);
      if (!manager) throw new TRPCError({ code: "NOT_FOUND" });

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await db.upsertUser({
        email: manager.email,
        passwordHash: newHash,
      });

      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input.salonId,
        action: "salon_password_reset",
      });

      return { success: true };
    }),

  deleteSalon: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const salon = await db.getSalonById(input);
      if (!salon) throw new TRPCError({ code: "NOT_FOUND" });

      await db.deleteSalon(input);
      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input,
        action: "salon_deleted",
      });

      return { success: true };
    }),
});

// ============= TRANSACTION ROUTER =============

const transactionRouter = router({
  create: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      type: z.enum(["encaissement", "decaissement"]),
      designation: z.string().min(2),
      amount: z.number().positive(),
      comment: z.string().optional(),
      date: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input.salonId);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await db.createTransaction({
        salonId: input.salonId,
        type: input.type,
        designation: input.designation,
        amount: input.amount,
        comment: input.comment,
        date: input.date,
      });

      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input.salonId,
        action: `transaction_created_${input.type}`,
        details: { amount: input.amount, designation: input.designation },
      });

      return { success: true };
    }),

  getBySalon: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      type: z.enum(["encaissement", "decaissement"]).optional(),
      designation: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input.salonId);
      if (!salon) throw new TRPCError({ code: "NOT_FOUND" });

      // Check permission: manager can only see their own salon
      if (ctx.user.role === "manager" && salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getTransactionsBySalon(input.salonId, {
        startDate: input.startDate,
        endDate: input.endDate,
        type: input.type,
        designation: input.designation,
        search: input.search,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      salonId: z.number(),
      designation: z.string().optional(),
      amount: z.number().positive().optional(),
      comment: z.string().optional(),
      date: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await db.getTransactionById(input.transactionId);
      if (!transaction) throw new TRPCError({ code: "NOT_FOUND" });

      const salon = await db.getSalonById(input.salonId);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateTransaction(input.transactionId, {
        designation: input.designation,
        amount: input.amount ? String(input.amount) : undefined,
        comment: input.comment,
        date: input.date,
      });

      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input.salonId,
        action: "transaction_updated",
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      salonId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const transaction = await db.getTransactionById(input.transactionId);
      if (!transaction) throw new TRPCError({ code: "NOT_FOUND" });

      const salon = await db.getSalonById(input.salonId);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.deleteTransaction(input.transactionId);

      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: input.salonId,
        action: "transaction_deleted",
      });

      return { success: true };
    }),
});

// ============= REPORT ROUTER =============

const reportRouter = router({
  getReportsBySalon: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input);
      if (!salon) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.user.role === "manager" && salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getReportsBySalon(input);
    }),

  getReportById: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const report = await db.getReportById(input);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      const salon = await db.getSalonById(report.salonId);
      if (!salon) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.user.role === "manager" && salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return report;
    }),

  deleteReport: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const report = await db.getReportById(input);
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      await db.deleteReport(input);

      await db.createAuditLog({
        userId: ctx.user.id,
        salonId: report.salonId,
        action: "report_deleted",
      });

      return { success: true };
    }),
});

// ============= NOTIFICATION ROUTER =============

const notificationRouter = router({
  getSettings: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getNotificationSettings(input);
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      salonId: z.number(),
      dailyReminder: z.boolean().optional(),
      inactivityAlert: z.boolean().optional(),
      reportNotification: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const salon = await db.getSalonById(input.salonId);
      if (!salon || salon.managerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.createOrUpdateNotificationSettings(input.salonId, {
        dailyReminder: input.dailyReminder,
        inactivityAlert: input.inactivityAlert,
        reportNotification: input.reportNotification,
      });

      return { success: true };
    }),
});

// ============= MAIN ROUTER =============

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  salon: salonRouter,
  transaction: transactionRouter,
  report: reportRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
