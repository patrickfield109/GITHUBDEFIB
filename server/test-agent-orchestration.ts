#!/usr/bin/env tsx
/**
 * OperatorOS Agent Orchestration Test Suite
 * Comprehensive testing of AI agent orchestration capabilities with real APIs
 */

import { agentOrchestration } from "./services/agent-orchestration";
import { commandProcessor } from "./services/command-processor";
import { openAIService } from "./services/openai-service";
import { storage } from "./storage";

class TestRunner {
  private testResults: { name: string; passed: boolean; error?: string }[] = [];
  
  async runAllTests() {
    console.log("🚀 Starting OperatorOS Agent Orchestration Test Suite\n");
    
    await this.testSystemStatus();
    await this.testAgentPoolManagement();
    await this.testTaskRouting();
    await this.testRealAIProcessing();
    await this.testConversationalInterface();
    await this.testHealthMonitoring();
    
    this.printResults();
  }

  private async testSystemStatus() {
    console.log("📊 Testing System Status...");
    
    await this.runTest("System Status Retrieval", async () => {
      const status = await agentOrchestration.getSystemStatus();
      
      if (!status.agentPools || status.agentPools.length === 0) {
        throw new Error("No agent pools found");
      }
      
      if (typeof status.tasks.active !== "number") {
        throw new Error("Invalid task metrics");
      }
      
      console.log(`  ✓ Found ${status.agentPools.length} agent pools`);
      console.log(`  ✓ Active tasks: ${status.tasks.active}, Queued: ${status.tasks.queued}`);
      console.log(`  ✓ Active conversations: ${status.conversations.active}`);
    });
  }

  private async testAgentPoolManagement() {
    console.log("\n🤖 Testing Agent Pool Management...");
    
    await this.runTest("Agent Pool Scaling", async () => {
      const pools = await storage.getAllAgentPools();
      const healthcarePool = pools.find(p => p.type === "healthcare");
      
      if (!healthcarePool) {
        throw new Error("Healthcare pool not found");
      }
      
      const originalCapacity = healthcarePool.capacity;
      await agentOrchestration.scaleAgentPool(healthcarePool.id, originalCapacity + 2);
      
      console.log(`  ✓ Scaled healthcare pool from ${originalCapacity} to ${originalCapacity + 2}`);
      
      // Wait for scaling to complete
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      const updatedPool = await storage.getAgentPool(healthcarePool.id);
      if (!updatedPool || updatedPool.capacity !== originalCapacity + 2) {
        throw new Error("Pool scaling failed");
      }
      
      console.log(`  ✓ Pool scaling completed successfully`);
    });
  }

  private async testTaskRouting() {
    console.log("\n📋 Testing Task Routing...");
    
    const testCases = [
      { type: "medical_analysis", input: { query: "What are the symptoms of flu?" } },
      { type: "stock_analysis", input: { query: "Analyze TSLA stock performance" } },
      { type: "workflow_automation", input: { query: "Automate email notifications" } },
      { type: "sports_betting", input: { query: "NBA game analysis for tonight" } }
    ];
    
    for (const testCase of testCases) {
      await this.runTest(`Task Routing - ${testCase.type}`, async () => {
        const taskId = await agentOrchestration.routeTask(
          testCase.type, 
          testCase.input,
          { test: true }
        );
        
        if (!taskId.startsWith("TK-")) {
          throw new Error("Invalid task ID format");
        }
        
        console.log(`  ✓ Created task: ${taskId}`);
        
        // Wait for task processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const task = await storage.getTask(taskId);
        if (!task) {
          throw new Error("Task not found after creation");
        }
        
        console.log(`  ✓ Task status: ${task.status}, Progress: ${task.progress}%`);
      });
    }
  }

  private async testRealAIProcessing() {
    console.log("\n🧠 Testing Real AI Processing...");
    
    const testTasks = [
      {
        type: "medical_analysis",
        input: { symptoms: "headache, fatigue", question: "What could this indicate?" },
        expectedProvider: ["openai", "anthropic"]
      },
      {
        type: "stock_analysis", 
        input: { symbol: "AAPL", timeframe: "1 week" },
        expectedProvider: ["openai", "anthropic"]
      }
    ];
    
    for (const testTask of testTasks) {
      await this.runTest(`Real AI Processing - ${testTask.type}`, async () => {
        const result = await openAIService.processTask(testTask.type, testTask.input);
        
        if (!result || !result.result) {
          throw new Error("No AI response received");
        }
        
        if (!result.provider || !testTask.expectedProvider.includes(result.provider)) {
          console.warn(`  ⚠️ Expected provider ${testTask.expectedProvider.join(" or ")}, got ${result.provider || "unknown"}`);
        }
        
        console.log(`  ✓ AI Response (${result.provider || "unknown"}): ${result.result.substring(0, 100)}...`);
        console.log(`  ✓ Model: ${result.model || "N/A"}`);
        
        if (result.usage) {
          console.log(`  ✓ Token usage: ${JSON.stringify(result.usage)}`);
        }
      });
    }
  }

  private async testConversationalInterface() {
    console.log("\n💬 Testing Conversational Interface...");
    
    const testCommands = [
      "Show me the system status",
      "Scale up the healthcare agent pool", 
      "I need help with chest pain symptoms",
      "Analyze Apple stock for investment",
      "What's the current system health?",
      "Show me a healthcare demo"
    ];
    
    for (const command of testCommands) {
      await this.runTest(`Conversational Command - "${command}"`, async () => {
        const response = await commandProcessor.processCommand(command, "test-session-001");
        
        if (!response || response.length < 10) {
          throw new Error("Response too short or empty");
        }
        
        if (response.includes("❌") && !command.includes("demo")) {
          console.warn(`  ⚠️ Warning: Error response for: "${command}"`);
        }
        
        console.log(`  ✓ Response: ${response.substring(0, 150)}...`);
      });
    }
  }

  private async testHealthMonitoring() {
    console.log("\n❤️ Testing Health Monitoring...");
    
    await this.runTest("Health Metrics Collection", async () => {
      const metrics = await storage.getLatestSystemMetrics();
      
      if (!metrics || metrics.length === 0) {
        throw new Error("No health metrics found");
      }
      
      const metricTypes = metrics.map(m => m.metricType);
      const expectedMetrics = ["cpu_usage", "memory_usage", "system_health"];
      
      for (const expected of expectedMetrics) {
        if (!metricTypes.includes(expected)) {
          throw new Error(`Missing metric: ${expected}`);
        }
      }
      
      console.log(`  ✓ Found ${metrics.length} metrics`);
      console.log(`  ✓ Metric types: ${metricTypes.join(", ")}`);
    });
  }

  private async runTest(name: string, testFn: () => Promise<void>) {
    try {
      await testFn();
      this.testResults.push({ name, passed: true });
      console.log(`✅ ${name} - PASSED`);
    } catch (error) {
      this.testResults.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name} - FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }

  private printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TEST RESULTS SUMMARY");
    console.log("=".repeat(60));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (failed > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.testResults
        .filter(r => !r.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
    
    console.log(`\n🎯 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    console.log("\n" + "=".repeat(60));
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new TestRunner();
  testRunner.runAllTests()
    .then(() => {
      console.log("🏁 Test suite completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test suite failed:", error);
      process.exit(1);
    });
}

export { TestRunner };