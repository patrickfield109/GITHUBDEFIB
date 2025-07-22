import { users, conversationSessions, agentPools, tasks, systemMetrics, activityLogs, type User, type InsertUser, type ConversationSession, type InsertConversationSession, type AgentPool, type InsertAgentPool, type Task, type InsertTask, type SystemMetric, type InsertSystemMetric, type ActivityLog, type InsertActivityLog } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation Sessions
  getConversationSession(sessionId: string): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(sessionId: string, updates: Partial<ConversationSession>): Promise<ConversationSession | undefined>;
  getActiveConversationSessions(): Promise<ConversationSession[]>;

  // Agent Pools
  getAllAgentPools(): Promise<AgentPool[]>;
  getAgentPool(id: number): Promise<AgentPool | undefined>;
  createAgentPool(pool: InsertAgentPool): Promise<AgentPool>;
  updateAgentPool(id: number, updates: Partial<AgentPool>): Promise<AgentPool | undefined>;

  // Tasks
  getAllTasks(): Promise<Task[]>;
  getTask(taskId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task | undefined>;
  getTasksByStatus(status: string): Promise<Task[]>;

  // System Metrics
  getLatestSystemMetrics(): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;

  // Activity Logs
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private conversationSessions: Map<string, ConversationSession> = new Map();
  private agentPools: Map<number, AgentPool> = new Map();
  private tasks: Map<string, Task> = new Map();
  private systemMetrics: SystemMetric[] = [];
  private activityLogs: ActivityLog[] = [];
  private currentUserId = 1;
  private currentSessionId = 1;
  private currentAgentPoolId = 1;
  private currentTaskId = 1;
  private currentMetricId = 1;
  private currentLogId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default agent pools
    const defaultPools: InsertAgentPool[] = [
      { name: "Healthcare", type: "healthcare", capacity: 5, activeAgents: 5, status: "online" },
      { name: "Financial", type: "financial", capacity: 8, activeAgents: 8, status: "online" },
      { name: "Business Auto", type: "business_automation", capacity: 3, activeAgents: 3, status: "online" },
      { name: "Sports Analytics", type: "sports_analytics", capacity: 4, activeAgents: 4, status: "scaling" },
    ];

    defaultPools.forEach(pool => this.createAgentPool(pool));

    // Initialize some sample metrics
    this.createSystemMetric({ metricType: "active_conversations", value: "127" });
    this.createSystemMetric({ metricType: "tasks_processed_today", value: "2847" });
    this.createSystemMetric({ metricType: "system_health", value: "99.8" });
    this.createSystemMetric({ metricType: "cpu_usage", value: "34" });
    this.createSystemMetric({ metricType: "memory_usage", value: "68" });
    this.createSystemMetric({ metricType: "api_response_time", value: "127" });

    // Initialize some activity logs
    this.createActivityLog({ type: "system", message: "Healthcare agent pool scaled up" });
    this.createActivityLog({ type: "task", message: "Financial analysis task completed" });
    this.createActivityLog({ type: "conversation", message: "New conversation started" });
    this.createActivityLog({ type: "system", message: "System backup completed" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getConversationSession(sessionId: string): Promise<ConversationSession | undefined> {
    return this.conversationSessions.get(sessionId);
  }

  async createConversationSession(insertSession: InsertConversationSession): Promise<ConversationSession> {
    const id = this.currentSessionId++;
    const session: ConversationSession = {
      ...insertSession,
      id,
      status: insertSession.status || "active",
      userId: insertSession.userId || null,
      context: insertSession.context || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversationSessions.set(insertSession.sessionId, session);
    return session;
  }

  async updateConversationSession(sessionId: string, updates: Partial<ConversationSession>): Promise<ConversationSession | undefined> {
    const session = this.conversationSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.conversationSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getActiveConversationSessions(): Promise<ConversationSession[]> {
    return Array.from(this.conversationSessions.values()).filter(s => s.status === "active");
  }

  async getAllAgentPools(): Promise<AgentPool[]> {
    return Array.from(this.agentPools.values());
  }

  async getAgentPool(id: number): Promise<AgentPool | undefined> {
    return this.agentPools.get(id);
  }

  async createAgentPool(insertPool: InsertAgentPool): Promise<AgentPool> {
    const id = this.currentAgentPoolId++;
    const pool: AgentPool = {
      ...insertPool,
      id,
      status: insertPool.status || "online",
      capacity: insertPool.capacity || 5,
      activeAgents: insertPool.activeAgents || 0,
      configuration: insertPool.configuration || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agentPools.set(id, pool);
    return pool;
  }

  async updateAgentPool(id: number, updates: Partial<AgentPool>): Promise<AgentPool | undefined> {
    const pool = this.agentPools.get(id);
    if (!pool) return undefined;
    
    const updatedPool = { ...pool, ...updates, updatedAt: new Date() };
    this.agentPools.set(id, updatedPool);
    return updatedPool;
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      status: insertTask.status || "queued",
      progress: insertTask.progress || 0,
      input: insertTask.input || null,
      output: insertTask.output || null,
      metadata: insertTask.metadata || null,
      agentPoolId: insertTask.agentPoolId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(insertTask.taskId, task);
    return task;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  async getLatestSystemMetrics(): Promise<SystemMetric[]> {
    return this.systemMetrics.slice(-10);
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const id = this.currentMetricId++;
    const metric: SystemMetric = {
      ...insertMetric,
      id,
      metadata: insertMetric.metadata || null,
      timestamp: new Date(),
    };
    this.systemMetrics.push(metric);
    return metric;
  }

  async getRecentActivityLogs(limit = 10): Promise<ActivityLog[]> {
    return this.activityLogs.slice(-limit).reverse();
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentLogId++;
    const log: ActivityLog = {
      ...insertLog,
      id,
      metadata: insertLog.metadata || null,
      timestamp: new Date(),
    };
    this.activityLogs.push(log);
    return log;
  }
}

export const storage = new MemStorage();
