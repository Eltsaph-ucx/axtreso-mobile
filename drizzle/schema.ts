import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  longtext
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Supports both direct email/password auth (for salon managers) and OAuth (for admin)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // For OAuth users (admin)
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }), // For direct auth users (managers)
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' or 'email'
  role: mysqlEnum("role", ["user", "admin", "manager"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Salon (Beauty Salon) table
 * Stores information about each salon managed in the system
 */
export const salons = mysqlTable("salons", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(), // Foreign key to users table
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(), // Libreville or Brazzaville
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Salon = typeof salons.$inferSelect;
export type InsertSalon = typeof salons.$inferInsert;

/**
 * Transaction table
 * Records all financial movements (encaissements and décaissements)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  salonId: int("salonId").notNull(), // Foreign key to salons
  type: mysqlEnum("type", ["encaissement", "decaissement"]).notNull(),
  designation: varchar("designation", { length: 255 }).notNull(), // e.g., "Pose perruque", "Salaires"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // FCFA
  comment: text("comment"),
  date: timestamp("date").notNull(), // Transaction date
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Report table
 * Stores generated financial reports with all analysis data
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  salonId: int("salonId").notNull(), // Foreign key to salons
  generatedBy: int("generatedBy").notNull(), // Foreign key to users (admin who generated)
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  
  // Summary data
  totalEncaissements: decimal("totalEncaissements", { precision: 12, scale: 2 }).notNull(),
  totalDecaissements: decimal("totalDecaissements", { precision: 12, scale: 2 }).notNull(),
  finalBalance: decimal("finalBalance", { precision: 12, scale: 2 }).notNull(),
  
  // Analysis data (stored as JSON)
  encaissementsBreakdown: json("encaissementsBreakdown"), // {designation: amount, ...}
  decaissementsBreakdown: json("decaissementsBreakdown"), // Top 10 {designation: amount, ...}
  momentumData: json("momentumData"), // {encaissementsPeak: {...}, decaissementsPeak: {...}}
  
  // AI-generated insights
  encaissementsInterpretation: longtext("encaissementsInterpretation"),
  decaissementsInterpretation: longtext("decaissementsInterpretation"),
  momentumInterpretation: longtext("momentumInterpretation"),
  personalizedAdvice: longtext("personalizedAdvice"), // Editable by admin
  adminComments: longtext("adminComments"), // Additional notes before export
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Report Export table
 * Tracks exported reports in different formats
 */
export const reportExports = mysqlTable("reportExports", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(), // Foreign key to reports
  format: mysqlEnum("format", ["pdf", "excel", "word"]).notNull(),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key for reference
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportExport = typeof reportExports.$inferSelect;
export type InsertReportExport = typeof reportExports.$inferInsert;

/**
 * Notification Settings table
 * Manages notification preferences for each salon
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").autoincrement().primaryKey(),
  salonId: int("salonId").notNull().unique(), // One setting per salon
  dailyReminder: boolean("dailyReminder").default(true).notNull(),
  inactivityAlert: boolean("inactivityAlert").default(true).notNull(),
  reportNotification: boolean("reportNotification").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

/**
 * Audit Log table
 * Tracks all important actions for security and compliance
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who performed action
  salonId: int("salonId"), // Related salon (nullable)
  action: varchar("action", { length: 255 }).notNull(), // e.g., "transaction_created", "report_generated"
  details: json("details"), // Additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
