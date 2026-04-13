import http from "http";
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { prisma } from "./utils/prismaClient.js";
import { redisClient } from "./utils/redis.js";
import rateLimit from "express-rate-limit";
import { dailyCredit } from "./constants/constants.js";
dotenv.config();
// Importing Routes ----------------------------------------------------------------------------------------------
import userRouter from "./routes/user.routes.js";
import noteRouter from "./routes/note.routes.js";
import fileRouter from "./routes/file.routes.js";
import quizRouter from "./routes/quiz.routes.js";
import userquizRouter from "./routes/userquiz.routes.js";
// Initializing Server -------------------------------------------------------------------------------------------
const app = express();
let server = http.createServer(app);
// Using Middleware -------------------------------------------------------------------------------------------
// Whitelist for trusted domains
const whitelist = ["http://localhost:3000"];
// Function to deny access to domains except those in whitelist.
const corsOptions = {
  origin: function (origin, callback) {
    // Find request domain and check in whitelist.
    if (origin && whitelist.indexOf(origin) !== -1) {
      // Accept request
      callback(null, true);
    } else {
      // Send CORS error.
      callback(new Error("Not allowed by CORS"));
    }
  },
};
// Limit each IP to 60 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
// Rate Limit
app.use(limiter);
// Parses request body.
app.use(express.urlencoded({ extended: true }));
// Add security to server.
app.use(helmet());
// Removes the "X-Powered-By" HTTP header from Express responses.
app.disable("x-powered-by");
// Parses JSON passed inside body.
app.use(express.json());
// Enable CORS
app.use(cors());
// Routes -------------------------------------------------------------------------------------------
// Default route to check if server is working.
app.get("/api/v1", (_, res) => {
  res.status(200).send("We are good to go!");
});
// Updating daily limit (cached via redis)
app.get(
  "/api/v1/update-limit",
  // Middleware to check if daily limit was already updated
  async (_, res, next) => {
    const result = await redisClient.get(`quizzer-update-daily-quiz-limit`);
    if (result) {
      // Send cached response if available
      res.status(200).send(JSON.parse(result));
      return;
    } else {
      next();
    }
  },
  // Function to update daily limit dat start of day
  async (_, res) => {
    try {
      const record = await prisma.dailyLimitUpdateDate.findFirst();
      const lastUpdate = record?.updateDate
        ? new Date(record.updateDate)
        : null;
      // Get today's date and end of day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      // Set next update time to tomorrow 00:00:00
      const nextUpdate = new Date(today);
      nextUpdate.setDate(today.getDate() + 1);
      const isNewDay =
        !lastUpdate || new Date(lastUpdate.setHours(0, 0, 0, 0)) < today;
      if (isNewDay) {
        // Reset all users' daily credit
        await prisma.user.updateMany({
          data: {
            dailyCredit: dailyCredit,
          },
        });
        // Update or insert the date record
        if (record) {
          await prisma.dailyLimitUpdateDate.update({
            where: { id: record.id },
            data: { updateDate: today },
          });
        } else {
          await prisma.dailyLimitUpdateDate.create({
            data: { updateDate: today },
          });
        }
        console.log("Daily limits reset for all users");
      } else {
        console.log("Daily limits already reset today");
      }
      // Cache result with TTL until end of day
      const ttlInSeconds = Math.ceil(
        (endOfDay.getTime() - now.getTime()) / 1000,
      );
      const payload = {
        data: isNewDay
          ? "Quizzer Daily Limit updated"
          : "Quizzer Daily Limit already up to date",
        nextUpdate: nextUpdate.toISOString(),
      };
      await redisClient.setEx(
        `quizzer-update-daily-quiz-limit`,
        ttlInSeconds,
        JSON.stringify(payload),
      );
      res.status(200).send(payload);
      return;
    } catch (err) {
      res.status(500).send({
        data: "Could not update daily limit.",
        nextUpdate: null,
      });
    }
  },
);
// Routes -----------------------------------------------------------------------------------------
// Auth Routes
app.use("/api/v1/user", userRouter);
// Note Routes
app.use("/api/v1/note", noteRouter);
// File Routes
app.use("/api/v1/file", fileRouter);
// Quiz Routes
app.use("/api/v1/quiz", quizRouter);
// User Quiz Routes
app.use("/api/v1/user-quiz", userquizRouter);
// Listening on PORT -------------------------------------------------------------------------------------------
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
