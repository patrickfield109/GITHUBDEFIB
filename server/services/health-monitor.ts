import { storage } from "../storage";

export class HealthMonitorService {
  private monitoringInterval: NodeJS.Timeout | null = null;

  start(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Simulate system metrics collection
      const metrics = await this.gatherSystemMetrics();
      
      for (const [metricType, value] of Object.entries(metrics)) {
        await storage.createSystemMetric({
          metricType,
          value: value.toString(),
        });
      }
    } catch (error) {
      console.error("Error collecting metrics:", error);
    }
  }

  private async gatherSystemMetrics(): Promise<Record<string, number>> {
    // In a real implementation, these would be actual system metrics
    const baseMetrics = {
      cpu_usage: Math.floor(Math.random() * 40) + 20, // 20-60%
      memory_usage: Math.floor(Math.random() * 30) + 50, // 50-80%
      api_response_time: Math.floor(Math.random() * 100) + 50, // 50-150ms
    };

    // Get conversation count
    const activeSessions = await storage.getActiveConversationSessions();
    const allTasks = await storage.getAllTasks();
    const todayTasks = allTasks.filter(task => {
      const today = new Date();
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === today.toDateString();
    });

    // Calculate health score
    const healthScore = this.calculateHealthScore(baseMetrics, activeSessions.length, allTasks.length);

    return {
      ...baseMetrics,
      active_conversations: activeSessions.length,
      tasks_processed_today: todayTasks.length,
      system_health: healthScore,
    };
  }

  private calculateHealthScore(
    metrics: Record<string, number>,
    conversations: number,
    totalTasks: number
  ): number {
    let score = 100;

    // Penalize high CPU usage
    if (metrics.cpu_usage > 80) score -= 20;
    else if (metrics.cpu_usage > 60) score -= 10;

    // Penalize high memory usage
    if (metrics.memory_usage > 90) score -= 20;
    else if (metrics.memory_usage > 75) score -= 10;

    // Penalize slow response times
    if (metrics.api_response_time > 200) score -= 15;
    else if (metrics.api_response_time > 150) score -= 5;

    // Bonus for active usage
    if (conversations > 100) score += 2;
    if (totalTasks > 1000) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  async getHealthSummary(): Promise<any> {
    const metrics = await storage.getLatestSystemMetrics();
    const agentPools = await storage.getAllAgentPools();
    const activeTasks = await storage.getTasksByStatus("processing");
    
    const metricsMap = metrics.reduce((acc, metric) => {
      acc[metric.metricType] = parseFloat(metric.value);
      return acc;
    }, {} as Record<string, number>);

    const healthScore = metricsMap.system_health || 0;
    let healthStatus = "unknown";
    
    if (healthScore >= 95) healthStatus = "excellent";
    else if (healthScore >= 85) healthStatus = "good";
    else if (healthScore >= 70) healthStatus = "fair";
    else healthStatus = "poor";

    return {
      overall: {
        score: healthScore,
        status: healthStatus,
        timestamp: new Date().toISOString(),
      },
      metrics: {
        cpu: metricsMap.cpu_usage || 0,
        memory: metricsMap.memory_usage || 0,
        responseTime: metricsMap.api_response_time || 0,
        conversations: metricsMap.active_conversations || 0,
        tasksToday: metricsMap.tasks_processed_today || 0,
      },
      agentPools: agentPools.map(pool => ({
        name: pool.name,
        status: pool.status,
        utilization: pool.capacity > 0 ? (pool.activeAgents / pool.capacity) * 100 : 0,
      })),
      activeTasks: activeTasks.length,
    };
  }
}

export const healthMonitor = new HealthMonitorService();
