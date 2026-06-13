import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { healthRoutes } from "./routes/health.routes";
import { aiRoutes } from "./routes/ai.routes";
import { initializeAIService } from "./services/ai.service";
import { config } from "./config/env";
import { homeRoutes } from "./routes/home.routes";

dotenv.config();
const requiredEnvVars = ["GEMINI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar] || process.env[envVar] === "",
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.error(
    "Please check your .env file and ensure all required variables are set.",
  );
}

initializeAIService();

const app = express();
const PORT = config.port;
const API_PREFIX = config.apiPrefix;
const NODE_ENV = config.nodeEnv;

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

app.use("/", homeRoutes);

app.use(`${API_PREFIX}/health`, healthRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

// Only start server if not in test environment
if (config.nodeEnv !== "test") {
  const server = app.listen(PORT, () => {
    logger.info(
      `JobPsych AI Assistant server running on http://localhost:${PORT}`,
    );
    logger.info(`API available at http://localhost:${PORT}${API_PREFIX}`);
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`AI Model: ${config.aiModel}`);

    if (missingEnvVars.length > 0) {
      logger.warn(
        `Some AI features may be limited due to missing configuration: ${missingEnvVars.join(
          ", ",
        )}`,
      );
    } else {
      logger.info("All environment variables configured correctly");
    }
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });
}

export default app;
