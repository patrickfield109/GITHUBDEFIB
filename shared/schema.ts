import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationSessions = pgTable("conversation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull().unique(),
  status: text("status").notNull().default("active"), // active, inactive, completed
  context: jsonb("context"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentPools = pgTable("agent_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // healthcare, financial, business_automation, sports_analytics
  capacity: integer("capacity").notNull().default(5),
  activeAgents: integer("active_agents").notNull().default(0),
  status: text("status").notNull().default("online"), // online, offline, scaling
  configuration: jsonb("configuration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  type: text("type").notNull(),
  agentPoolId: integer("agent_pool_id").references(() => agentPools.id),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  progress: integer("progress").notNull().default(0),
  input: jsonb("input"),
  output: jsonb("output"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  value: text("value").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentPoolSchema = createInsertSchema(agentPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;

export type AgentPool = typeof agentPools.$inferSelect;
export type InsertAgentPool = z.infer<typeof insertAgentPoolSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
