import { storage } from "../storage";
import { InsertTask, AgentPool } from "@shared/schema";
import { openAIService } from "./openai-service";

export class AgentOrchestrationService {
  private taskQueue: string[] = [];
  private processingTasks: Set<string> = new Set();

  async routeTask(type: string, input: any, metadata?: any): Promise<string> {
    const agentPools = await storage.getAllAgentPools();
    const suitablePool = this.findSuitableAgentPool(type, agentPools);
    
    if (!suitablePool) {
      throw new Error(`No suitable agent pool found for task type: ${type}`);
    }

    const taskId = `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const task: InsertTask = {
      taskId,
      type,
      agentPoolId: suitablePool.id,
      status: "queued",
      input,
      metadata,
      progress: 0,
    };

    await storage.createTask(task);
    this.taskQueue.push(taskId);

    // Log activity
    await storage.createActivityLog({
      type: "task",
      message: `New ${type} task queued`,
      metadata: { taskId },
    });

    // Process task asynchronously
    setTimeout(() => this.processTask(taskId), 100);

    return taskId;
  }

  private findSuitableAgentPool(taskType: string, pools: AgentPool[]): AgentPool | null {
    const typeMapping: Record<string, string> = {
      "medical_analysis": "healthcare",
      "health_consultation": "healthcare",
      "stock_analysis": "financial",
      "investment_advice": "financial",
      "workflow_automation": "business_automation",
      "project_management": "business_automation",
      "sports_betting": "sports_analytics",
      "game_analysis": "sports_analytics",
    };

    const requiredPoolType = typeMapping[taskType];
    if (!requiredPoolType) return null;

    return pools.find(pool => 
      pool.type === requiredPoolType && 
      pool.status === "online" && 
      pool.activeAgents > 0
    ) || null;
  }

  private async processTask(taskId: string): Promise<void> {
    if (this.processingTasks.has(taskId)) return;
    
    this.processingTasks.add(taskId);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      this.processingTasks.delete(taskId);
      return;
    }

    try {
      // Update status to processing
      await storage.updateTask(taskId, { status: "processing", progress: 10 });

      // Simulate progress updates
      for (let progress = 20; progress <= 80; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await storage.updateTask(taskId, { progress });
      }

      // Use OpenAI service to process the task
      const result = await openAIService.processTask(task.type, task.input);

      // Complete the task
      await storage.updateTask(taskId, {
        status: "completed",
        progress: 100,
        output: result,
      });

      await storage.createActivityLog({
        type: "task",
        message: `${task.type} task completed`,
        metadata: { taskId },
      });

    } catch (error) {
      await storage.updateTask(taskId, {
        status: "failed",
        output: { error: error instanceof Error ? error.message : "Unknown error" },
      });

      await storage.createActivityLog({
        type: "error",
        message: `Task ${taskId} failed`,
        metadata: { taskId, error: error instanceof Error ? error.message : "Unknown error" },
      });
    } finally {
      this.processingTasks.delete(taskId);
      const index = this.taskQueue.indexOf(taskId);
      if (index > -1) {
        this.taskQueue.splice(index, 1);
      }
    }
  }

  async scaleAgentPool(poolId: number, newCapacity: number): Promise<void> {
    const pool = await storage.getAgentPool(poolId);
    if (!pool) {
      throw new Error(`Agent pool ${poolId} not found`);
    }

    await storage.updateAgentPool(poolId, {
      capacity: newCapacity,
      activeAgents: Math.min(newCapacity, pool.activeAgents),
      status: "scaling",
    });

    // Simulate scaling process
    setTimeout(async () => {
      await storage.updateAgentPool(poolId, {
        activeAgents: newCapacity,
        status: "online",
      });

      await storage.createActivityLog({
        type: "system",
        message: `${pool.name} agent pool scaled to ${newCapacity} agents`,
        metadata: { poolId, newCapacity },
      });
    }, 3000);
  }

  async getSystemStatus(): Promise<any> {
    const [agentPools, tasks, metrics, activities] = await Promise.all([
      storage.getAllAgentPools(),
      storage.getAllTasks(),
      storage.getLatestSystemMetrics(),
      storage.getRecentActivityLogs(5),
    ]);

    const activeTasks = tasks.filter(t => t.status === "processing").length;
    const queuedTasks = tasks.filter(t => t.status === "queued").length;
    const activeConversations = await storage.getActiveConversationSessions();

    return {
      agentPools: agentPools.map(pool => ({
        id: pool.id,
        name: pool.name,
        type: pool.type,
        status: pool.status,
        activeAgents: pool.activeAgents,
        capacity: pool.capacity,
      })),
      tasks: {
        active: activeTasks,
        queued: queuedTasks,
        total: tasks.length,
      },
      conversations: {
        active: activeConversations.length,
      },
      metrics: metrics.reduce((acc, metric) => {
        acc[metric.metricType] = metric.value;
        return acc;
      }, {} as Record<string, string>),
      recentActivity: activities,
    };
  }
}

export const agentOrchestration = new AgentOrchestrationService();
