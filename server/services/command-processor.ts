import { agentOrchestration } from "./agent-orchestration";
import { openAIService } from "./openai-service";
import { storage } from "../storage";

export class CommandProcessor {
  async processCommand(command: string, sessionId: string): Promise<string> {
    const normalizedCommand = command.toLowerCase().trim();

    try {
      // System status commands
      if (this.isStatusCommand(normalizedCommand)) {
        return await this.handleStatusCommand();
      }

      // Agent pool commands
      if (this.isAgentPoolCommand(normalizedCommand)) {
        return await this.handleAgentPoolCommand(normalizedCommand);
      }

      // Task submission commands
      if (this.isTaskCommand(normalizedCommand)) {
        return await this.handleTaskCommand(normalizedCommand, sessionId);
      }

      // Health monitoring commands
      if (this.isHealthCommand(normalizedCommand)) {
        return await this.handleHealthCommand();
      }

      // EKG analysis commands
      if (this.isEKGCommand(normalizedCommand)) {
        return await this.handleEKGCommand(normalizedCommand);
      }

      // Demo commands
      if (this.isDemoCommand(normalizedCommand)) {
        return await this.handleDemoCommand(normalizedCommand);
      }

      // General help
      if (this.isHelpCommand(normalizedCommand)) {
        return this.getHelpMessage();
      }

      // Enhanced AI-powered command processing for natural language
      const systemStatus = await agentOrchestration.getSystemStatus();
      const enhancedResponse = await openAIService.processConversationalCommand(command, {
        sessionId,
        systemStatus: {
          agentPools: systemStatus.agentPools.length,
          activeTasks: systemStatus.tasks.active,
          queuedTasks: systemStatus.tasks.queued,
          healthScore: systemStatus.metrics.system_health
        }
      });

      return enhancedResponse || this.getUnrecognizedCommandResponse(command);
    } catch (error) {
      console.error("Command processing error:", error);
      return "❌ I encountered an error processing your command. Please try again or contact support if the issue persists.";
    }
  }

  private isStatusCommand(command: string): boolean {
    const statusKeywords = ["status", "system status", "show status", "health", "overview"];
    return statusKeywords.some(keyword => command.includes(keyword));
  }

  private isAgentPoolCommand(command: string): boolean {
    const poolKeywords = ["agent pool", "scale", "pool", "agents"];
    return poolKeywords.some(keyword => command.includes(keyword));
  }

  private isTaskCommand(command: string): boolean {
    const taskKeywords = ["medical", "health", "stock", "investment", "automate", "workflow", "sports", "betting"];
    return taskKeywords.some(keyword => command.includes(keyword));
  }

  private isEKGCommand(command: string): boolean {
    const ekgKeywords = ["ekg", "ecg", "electrocardiogram", "heart rhythm", "cardiac analysis"];
    return ekgKeywords.some(keyword => command.includes(keyword));
  }

  private isHealthCommand(command: string): boolean {
    const healthKeywords = ["health", "metrics", "performance", "monitor"];
    return healthKeywords.some(keyword => command.includes(keyword));
  }

  private isDemoCommand(command: string): boolean {
    const demoKeywords = ["demo", "example", "show me", "demonstrate"];
    return demoKeywords.some(keyword => command.includes(keyword));
  }

  private isHelpCommand(command: string): boolean {
    const helpKeywords = ["help", "commands", "what can you do"];
    return helpKeywords.some(keyword => command.includes(keyword));
  }

  private async handleStatusCommand(): Promise<string> {
    try {
      const status = await agentOrchestration.getSystemStatus();
      
      let response = "✅ **System Status Overview**\n\n";
      
      response += `**Agent Pools:** ${status.agentPools.filter((p: any) => p.status === "online").length}/${status.agentPools.length} operational\n`;
      response += `**Active Tasks:** ${status.tasks.active} processing, ${status.tasks.queued} queued\n`;
      response += `**Active Conversations:** ${status.conversations.active}\n`;
      response += `**System Health:** ${status.metrics.system_health}%\n\n`;
      
      response += "**Agent Pool Details:**\n";
      status.agentPools.forEach((pool: any) => {
        const statusIcon = pool.status === "online" ? "🟢" : pool.status === "scaling" ? "🟡" : "🔴";
        response += `${statusIcon} ${pool.name}: ${pool.activeAgents}/${pool.capacity} agents ${pool.status}\n`;
      });

      if (status.recentActivity.length > 0) {
        response += "\n**Recent Activity:**\n";
        status.recentActivity.slice(0, 3).forEach((activity: any) => {
          response += `• ${activity.message}\n`;
        });
      }

      return response;
    } catch (error) {
      return "❌ Error retrieving system status. Please try again.";
    }
  }

  private async handleAgentPoolCommand(command: string): Promise<string> {
    if (command.includes("scale")) {
      // Extract pool name and scale operation
      const agentPools = await storage.getAllAgentPools();
      
      if (command.includes("healthcare")) {
        const pool = agentPools.find(p => p.type === "healthcare");
        if (pool) {
          await agentOrchestration.scaleAgentPool(pool.id, pool.capacity + 2);
          return `🔄 Scaling healthcare agent pool to ${pool.capacity + 2} agents. This may take a few moments...`;
        }
      }
      
      if (command.includes("financial")) {
        const pool = agentPools.find(p => p.type === "financial");
        if (pool) {
          await agentOrchestration.scaleAgentPool(pool.id, pool.capacity + 3);
          return `🔄 Scaling financial agent pool to ${pool.capacity + 3} agents. This may take a few moments...`;
        }
      }
    }

    // Default agent pool status
    const agentPools = await storage.getAllAgentPools();
    let response = "🤖 **Agent Pool Status:**\n\n";
    
    agentPools.forEach(pool => {
      const statusIcon = pool.status === "online" ? "🟢" : pool.status === "scaling" ? "🟡" : "🔴";
      response += `${statusIcon} **${pool.name}** (${pool.type})\n`;
      response += `   Active: ${pool.activeAgents}/${pool.capacity} agents\n`;
      response += `   Status: ${pool.status}\n\n`;
    });

    return response;
  }

  private async handleTaskCommand(command: string, sessionId: string): Promise<string> {
    try {
      let taskType = "";
      let input = { query: command };

      if (command.includes("medical") || command.includes("health")) {
        taskType = "medical_analysis";
      } else if (command.includes("stock") || command.includes("investment")) {
        taskType = "stock_analysis";
      } else if (command.includes("automate") || command.includes("workflow")) {
        taskType = "workflow_automation";
      } else if (command.includes("sports") || command.includes("betting")) {
        taskType = "sports_betting";
      }

      if (!taskType) {
        return "❓ I couldn't determine the task type. Please specify if this is related to healthcare, financial analysis, business automation, or sports analytics.";
      }

      const taskId = await agentOrchestration.routeTask(taskType, input);
      
      return `✅ **Task Created Successfully**\n\n` +
             `**Task ID:** ${taskId}\n` +
             `**Type:** ${taskType.replace("_", " ")}\n` +
             `**Status:** Queued for processing\n\n` +
             `Your task has been assigned to the appropriate agent pool and will be processed shortly. You can check the task queue for updates.`;
    } catch (error) {
      return `❌ Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  private async handleHealthCommand(): Promise<string> {
    try {
      const metrics = await storage.getLatestSystemMetrics();
      const metricsMap = metrics.reduce((acc, metric) => {
        acc[metric.metricType] = metric.value;
        return acc;
      }, {} as Record<string, string>);

      let response = "📊 **System Health Metrics**\n\n";
      
      response += `**Performance:**\n`;
      response += `• CPU Usage: ${metricsMap.cpu_usage || "N/A"}%\n`;
      response += `• Memory Usage: ${metricsMap.memory_usage || "N/A"}%\n`;
      response += `• API Response Time: ${metricsMap.api_response_time || "N/A"}ms\n\n`;
      
      response += `**Activity:**\n`;
      response += `• Active Conversations: ${metricsMap.active_conversations || "N/A"}\n`;
      response += `• Tasks Processed Today: ${metricsMap.tasks_processed_today || "N/A"}\n`;
      response += `• Overall Health Score: ${metricsMap.system_health || "N/A"}%\n`;

      return response;
    } catch (error) {
      return "❌ Error retrieving health metrics. Please try again.";
    }
  }

  private async handleDemoCommand(command: string): Promise<string> {
    if (command.includes("healthcare") || command.includes("medical")) {
      return this.getHealthcareDemo();
    } else if (command.includes("financial")) {
      return this.getFinancialDemo();
    } else if (command.includes("business") || command.includes("automation")) {
      return this.getBusinessDemo();
    } else if (command.includes("sports")) {
      return this.getSportsDemo();
    }

    return this.getGeneralDemo();
  }

  private getHealthcareDemo(): string {
    return `🏥 **Healthcare Agent Demo**\n\n` +
           `**Example Command:** "I need medical advice about chest pain symptoms"\n\n` +
           `**Agent Response:** The healthcare agent would analyze symptoms, provide general guidance, and recommend appropriate medical consultation.\n\n` +
           `**Capabilities:**\n` +
           `• Symptom analysis\n` +
           `• General health guidance\n` +
           `• Medical information lookup\n` +
           `• Wellness recommendations\n\n` +
           `*Note: Always consult healthcare professionals for serious medical concerns.*`;
  }

  private getFinancialDemo(): string {
    return `💰 **Financial Agent Demo**\n\n` +
           `**Example Command:** "Analyze AAPL stock performance and give investment recommendations"\n\n` +
           `**Agent Response:** The financial agent would provide market analysis, risk assessment, and investment insights.\n\n` +
           `**Capabilities:**\n` +
           `• Stock analysis\n` +
           `• Market trend evaluation\n` +
           `• Portfolio recommendations\n` +
           `• Risk assessment\n\n` +
           `*Note: This is not financial advice. Always do your own research.*`;
  }

  private getBusinessDemo(): string {
    return `🏢 **Business Automation Demo**\n\n` +
           `**Example Command:** "Help me automate my project management workflow"\n\n` +
           `**Agent Response:** The automation agent would analyze your workflow and suggest optimization strategies.\n\n` +
           `**Capabilities:**\n` +
           `• Workflow optimization\n` +
           `• Process automation\n` +
           `• Efficiency analysis\n` +
           `• Integration recommendations`;
  }

  private getSportsDemo(): string {
    return `⚽ **Sports Analytics Demo**\n\n` +
           `**Example Command:** "Create a sports betting strategy for tonight's games"\n\n` +
           `**Agent Response:** The sports agent would analyze team performance, statistics, and provide strategic insights.\n\n` +
           `**Capabilities:**\n` +
           `• Game analysis\n` +
           `• Performance statistics\n` +
           `• Strategic insights\n` +
           `• Trend analysis`;
  }

  private getGeneralDemo(): string {
    return `🎯 **OperatorOS Demo Overview**\n\n` +
           `**Available Demos:**\n` +
           `• "Show me a healthcare demo"\n` +
           `• "Walk me through financial analysis capabilities"\n` +
           `• "Demonstrate sports analytics features"\n` +
           `• "Run a business automation example"\n\n` +
           `Try any of these commands to see specific agent capabilities!`;
  }

  private getHelpMessage(): string {
    return `🤖 **OperatorOS Command Guide**\n\n` +
           `**System Commands:**\n` +
           `• "Show me the system status"\n` +
           `• "How are the agent pools performing?"\n` +
           `• "Display health metrics"\n\n` +
           `**Task Submission:**\n` +
           `• "I need medical advice about [symptoms]"\n` +
           `• "Analyze [stock] performance"\n` +
           `• "Help me automate [process]"\n` +
           `• "Create a sports strategy for [game]"\n` +
           `• "Analyze this EKG image"\n\n` +
           `**Agent Management:**\n` +
           `• "Scale up the healthcare agent pool"\n` +
           `• "Check the status of financial agents"\n\n` +
           `**Demos:**\n` +
           `• "Show me a [healthcare/financial/business/sports] demo"\n\n` +
           `Just type your request naturally - I'll understand!`;
  }

  private async handleEKGCommand(command: string): Promise<string> {
    return `🏥 **EKG Analysis System Ready**

**Available EKG Analysis Features:**
• Upload EKG images for comprehensive analysis
• Component identification (P waves, QRS, T waves)
• Measurement analysis (PR interval, QT interval, etc.)
• Abnormality detection (ST elevation, Q waves, arrhythmias)
• Labeled diagram generation
• Clinical interpretation

**How to Submit EKG for Analysis:**
1. Use the API endpoint: POST /api/submit-task
2. Task type: "medical_analysis"
3. Include: type: "ekg_analysis", image: "[base64_image_data]"

**Example Command:**
\`curl -X POST /api/submit-task -H "Content-Type: application/json" -d '{"type": "medical_analysis", "input": {"type": "ekg_analysis", "image": "data:image/png;base64,..." }}'\`

The system will provide:
• Detailed measurements and analysis
• Labeled image with component identification
• Clinical interpretation with recommendations

*Note: For educational purposes only. Always consult medical professionals for clinical decisions.*`;
  }

  private getUnrecognizedCommandResponse(command: string): string {
    return `❓ I didn't understand that command. Here are some things you can try:\n\n` +
           `• Ask for "system status" to see overall health\n` +
           `• Submit tasks like "analyze AAPL stock" or "medical advice for headaches"\n` +
           `• Manage agents with "scale healthcare pool"\n` +
           `• Type "help" for a full command guide\n\n` +
           `Your original request: "${command}"`;
  }
}

export const commandProcessor = new CommandProcessor();
