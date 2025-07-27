import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentOrchestration } from "./services/agent-orchestration";
import { commandProcessor } from "./services/command-processor";
import { healthMonitor } from "./services/health-monitor";
import { ekgAnnotationService } from "./services/ekg-annotation-service";
import { openAIService } from "./services/openai-service";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { insertConversationSessionSchema, insertTaskSchema } from "@shared/schema";

// Start health monitoring
healthMonitor.start();

export async function registerRoutes(app: Express): Promise<Server> {
  // System status endpoint
  app.get("/api/system/status", async (req, res) => {
    try {
      const status = await agentOrchestration.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = await healthMonitor.getHealthSummary();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: "Failed to get health status" });
    }
  });

  // Agent pools endpoints
  app.get("/api/agent-pools", async (req, res) => {
    try {
      const pools = await storage.getAllAgentPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: "Failed to get agent pools" });
    }
  });

  app.post("/api/agent-pools/:id/scale", async (req, res) => {
    try {
      const poolId = parseInt(req.params.id);
      const { capacity } = req.body;
      
      if (!capacity || capacity < 1) {
        return res.status(400).json({ error: "Invalid capacity" });
      }

      await agentOrchestration.scaleAgentPool(poolId, capacity);
      res.json({ message: "Scaling initiated" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Scaling failed" });
    }
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status } = req.query;
      const tasks = status 
        ? await storage.getTasksByStatus(status as string)
        : await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:taskId", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to get task" });
    }
  });

  // Conversation sessions endpoints
  app.post("/api/conversations", async (req, res) => {
    try {
      const sessionData = insertConversationSessionSchema.parse(req.body);
      const session = await storage.createConversationSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/conversations/:sessionId", async (req, res) => {
    try {
      const session = await storage.getConversationSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Command processing endpoint
  app.post("/api/command", async (req, res) => {
    try {
      const { command, sessionId } = req.body;
      
      if (!command || !sessionId) {
        return res.status(400).json({ error: "Command and sessionId are required" });
      }

      const response = await commandProcessor.processCommand(command, sessionId);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to process command" });
    }
  });

  // EKG Analysis with downloadable annotations
  app.post("/api/analyze-ekg", async (req, res) => {
    try {
      const { image, taskId } = req.body;
      
      if (!image || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: "Valid image data required" });
      }
      
      // Extract base64 data
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique task ID if not provided
      const analysisTaskId = taskId || `ekg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Process EKG with annotations
      const result = await ekgAnnotationService.analyzeAndAnnotateEKG(imageBuffer, analysisTaskId);
      
      res.json({
        taskId: analysisTaskId,
        status: "completed",
        analysis: {
          heartRate: result.analysis.heartRate,
          rhythm: result.analysis.rhythm,
          intervals: result.analysis.intervals,
          findings: result.analysis.findings,
          interpretation: result.analysis.findings.includes('Normal') ? 'Normal EKG' : 'Abnormal findings detected'
        },
        downloads: {
          annotatedImage: result.downloadUrls.png,
          report: result.downloadUrls.pdf
        },
        message: "EKG analysis completed with downloadable annotations"
      });
      
    } catch (error) {
      console.error('EKG analysis error:', error);
      res.status(500).json({ error: "Failed to analyze EKG" });
    }
  });

  // Critical EKG Analysis endpoint
  app.post('/api/analyze-critical-ekg', async (req, res) => {
    try {
      const { image, taskId } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: 'EKG image is required' });
      }

      // Extract base64 data
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique task ID if not provided
      const analysisTaskId = taskId || `critical_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Process with critical analysis protocol
      const analysis = await openAIService.analyzeCriticalEKG(image);
      
      // Process EKG with annotations using existing service
      const result = await ekgAnnotationService.analyzeAndAnnotateEKG(imageBuffer, analysisTaskId);

      res.json({
        taskId: analysisTaskId,
        analysis: {
          heartRate: analysis.heartRate,
          rhythm: analysis.rhythm,
          interpretation: analysis.interpretation,
          intervals: analysis.intervals,
          findings: analysis.findings,
          systematicCounts: analysis.systematicCounts,
          avAnalysis: analysis.avAnalysis,
          emergencyFlags: analysis.emergencyFlags,
          componentValidation: analysis.componentValidation
        },
        downloads: {
          annotatedImage: result.downloadUrls.png,
          report: result.downloadUrls.pdf
        },
        status: 'completed'
      });
    } catch (error) {
      console.error('Critical EKG analysis error:', error);
      res.status(500).json({ 
        error: 'Critical EKG analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Download endpoint for generated files
  app.get("/api/download/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const downloadPath = path.join(process.cwd(), 'downloads', filename);
      
      if (!fs.existsSync(downloadPath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'image/png';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(downloadPath);
      fileStream.pipe(res);
      
    } catch (error) {
      res.status(500).json({ error: "Download failed" });
    }
  });

  // Task submission endpoint (simplified interface)
  app.post("/api/submit-task", async (req, res) => {
    try {
      const { type, input, metadata } = req.body;
      
      if (!type || !input) {
        return res.status(400).json({ error: "Type and input are required" });
      }

      const taskId = await agentOrchestration.routeTask(type, input, metadata);
      res.json({ taskId, message: "Task submitted successfully" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to submit task" });
    }
  });

  // Activity logs endpoint
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivityLogs(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get activity logs" });
    }
  });

  // Metrics endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
