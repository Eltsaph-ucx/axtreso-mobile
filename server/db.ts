import { eq, and, gte, lte, desc, asc, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  salons,
  transactions,
  reports,
  reportExports,
  notificationSettings,
  auditLogs,
  type Salon,
  type Transaction,
  type Report,
  type ReportExport,
  type NotificationSettings,
  type AuditLog
} from "../drizzle/schema";
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

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email && !user.openId) {
    throw new Error("User email or openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod", "passwordHash"] as const;
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= SALON OPERATIONS =============

export async function createSalon(data: {
  managerId: number;
  name: string;
  city: string;
  email?: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(salons).values(data);
  return result;
}

export async function getSalonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salons).where(eq(salons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSalonsByManager(managerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salons).where(eq(salons.managerId, managerId));
}

export async function getAllSalons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salons).orderBy(desc(salons.createdAt));
}

export async function updateSalon(id: number, data: Partial<Salon>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(salons).set(data).where(eq(salons.id, id));
}

export async function deleteSalon(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(salons).where(eq(salons.id, id));
}

// ============= TRANSACTION OPERATIONS =============

export async function createTransaction(data: {
  salonId: number;
  type: "encaissement" | "decaissement";
  designation: string;
  amount: string | number;
  comment?: string;
  date: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(transactions).values({
    salonId: data.salonId,
    type: data.type,
    designation: data.designation,
    amount: String(data.amount),
    comment: data.comment,
    date: data.date,
  });
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTransactionsBySalon(
  salonId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: "encaissement" | "decaissement";
    designation?: string;
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(transactions.salonId, salonId)];
  
  if (filters?.startDate) {
    conditions.push(gte(transactions.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(transactions.date, filters.endDate));
  }
  if (filters?.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters?.designation) {
    conditions.push(eq(transactions.designation, filters.designation));
  }
  if (filters?.search) {
    conditions.push(like(transactions.designation, `%${filters.search}%`));
  }
  
  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date));
}

export async function updateTransaction(id: number, data: Partial<Transaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(transactions).set(data).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(transactions).where(eq(transactions.id, id));
}

// ============= REPORT OPERATIONS =============

export async function createReport(data: {
  salonId: number;
  generatedBy: number;
  startDate: Date;
  endDate: Date;
  totalEncaissements: string | number;
  totalDecaissements: string | number;
  finalBalance: string | number;
  encaissementsBreakdown?: Record<string, number>;
  decaissementsBreakdown?: Record<string, number>;
  momentumData?: Record<string, unknown>;
  encaissementsInterpretation?: string;
  decaissementsInterpretation?: string;
  momentumInterpretation?: string;
  personalizedAdvice?: string;
  adminComments?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(reports).values({
    salonId: data.salonId,
    generatedBy: data.generatedBy,
    startDate: data.startDate,
    endDate: data.endDate,
    totalEncaissements: String(data.totalEncaissements),
    totalDecaissements: String(data.totalDecaissements),
    finalBalance: String(data.finalBalance),
    encaissementsBreakdown: data.encaissementsBreakdown,
    decaissementsBreakdown: data.decaissementsBreakdown,
    momentumData: data.momentumData,
    encaissementsInterpretation: data.encaissementsInterpretation,
    decaissementsInterpretation: data.decaissementsInterpretation,
    momentumInterpretation: data.momentumInterpretation,
    personalizedAdvice: data.personalizedAdvice,
    adminComments: data.adminComments,
  });
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getReportsBySalon(salonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.salonId, salonId)).orderBy(desc(reports.createdAt));
}

export async function updateReport(id: number, data: Partial<Report>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(reports).set(data).where(eq(reports.id, id));
}

export async function deleteReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(reports).where(eq(reports.id, id));
}

// ============= REPORT EXPORT OPERATIONS =============

export async function createReportExport(data: {
  reportId: number;
  format: "pdf" | "excel" | "word";
  fileUrl: string;
  fileKey: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(reportExports).values(data);
}

export async function getReportExportsByReport(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportExports).where(eq(reportExports.reportId, reportId));
}

// ============= NOTIFICATION SETTINGS OPERATIONS =============

export async function getNotificationSettings(salonId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notificationSettings).where(eq(notificationSettings.salonId, salonId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateNotificationSettings(
  salonId: number,
  data: Partial<NotificationSettings>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getNotificationSettings(salonId);
  if (existing) {
    return db.update(notificationSettings).set(data).where(eq(notificationSettings.salonId, salonId));
  } else {
    return db.insert(notificationSettings).values({
      salonId,
      ...data,
    });
  }
}

// ============= AUDIT LOG OPERATIONS =============

export async function createAuditLog(data: {
  userId: number;
  salonId?: number;
  action: string;
  details?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }
  
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}
