import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { config } from "../config/env";
import { logger } from "../utils/logger";

const router = Router();

// GET /  - Home / metadata route
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const uptimeSeconds = process.uptime();
    const info = {
      name: process.env.npm_package_name || "jobpsych-ai-assistant",
      description:
        process.env.npm_package_description ||
        "JobPsych AI Assistant - Career psychology and professional development guidance",
      version: process.env.npm_package_version || "1.0.0",
      environment: config.nodeEnv,
      apiPrefix: config.apiPrefix,
      ai: {
        model: config.aiModel,
        apiKeyConfigured: !!config.geminiApiKey,
      },
      rateLimit: {
        windowMs: config.rateLimit.windowMs,
        maxRequests: config.rateLimit.maxRequests,
      },
      cors: {
        origins: config.corsOrigins,
      },
      uptime: {
        seconds: uptimeSeconds,
        human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor(
          (uptimeSeconds % 3600) / 60,
        )}m ${Math.floor(uptimeSeconds % 60)}s`,
      },
      timestamp: new Date().toISOString(),
      routes: [
        {
          method: "GET",
          path: "/",
          description: "Home route with service metadata and all route details",
        },
        {
          method: "GET",
          path: `${config.apiPrefix}/health`,
          description: "Basic health check with system metrics",
        },
        {
          method: "GET",
          path: `${config.apiPrefix}/health/detailed`,
          description:
            "Detailed health check with system and service information",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/chat`,
          description: "General chat with JobPsych AI assistant",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/coaching`,
          description: "Career coaching sessions with specialized guidance",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/analyze-job`,
          description: "Job analysis and career fit assessment",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/analyze`,
          description: "Text analysis (sentiment, summary, keywords)",
        },
        {
          method: "GET",
          path: `${config.apiPrefix}/ai/models`,
          description: "Get available AI models",
        },
        {
          method: "GET",
          path: `${config.apiPrefix}/ai/status`,
          description: "AI service status and configuration",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/career-path`,
          description: "Career path recommendations",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/interview-prep`,
          description: "Interview preparation assistance",
        },
        {
          method: "POST",
          path: `${config.apiPrefix}/ai/skill-gap`,
          description: "Skill gap analysis",
        },
      ],
      workflow: {
        description: "Codebase request processing workflow",
        steps: [
          "1. Request arrives at Express server",
          "2. Middleware applied: Helmet (security), CORS, Rate Limiting, Compression, Logging",
          "3. Request routed to appropriate handler via routes (health, ai, home)",
          "4. Route handler calls controller function with async error handling",
          "5. Controller validates request with Joi schemas",
          "6. Controller calls service layer (e.g., AI service for Gemini integration)",
          "7. Service processes request and returns data",
          "8. Controller formats response and sends JSON",
          "9. Error handler catches any exceptions and returns appropriate error responses",
        ],
        architecture:
          "Functional architecture with separation of concerns: Routes -> Controllers -> Services -> Utils",
      },
      docs: {
        health: `${config.apiPrefix}/health`,
        ai: `${config.apiPrefix}/ai`,
        status: `${config.apiPrefix}/ai/status`,
        models: `${config.apiPrefix}/ai/models`,
      },
    };

    logger.debug("Home route accessed", { uptimeSeconds });

    res.status(200).json({ success: true, data: info });
  }),
);

export { router as homeRoutes };
