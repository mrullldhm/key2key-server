import express from "express";
import authRouter from "./routes/auth.routes.js";
import authorize from "./middleware/auth.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { config } from "dotenv";
import { connectDB } from "./database/db.js";
import credentialRouter from "./routes/credential.routes.js";
import shareRouter from "./routes/share.routes.js";
import helmet from "helmet";
import cors from "cors";

config();
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200", // URL of your Frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Allows sending cookies/tokens if needed
  })
);

// Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the key2key API server");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/credential", authorize, credentialRouter);
app.use("/api/v1/share", authorize, shareRouter);

// Error Handller Middleware
app.use(errorMiddleware);

// Port listening
app.listen(process.env.PORT, () => {
  console.log(
    `The server is listening on http://localhost:${process.env.PORT}`
  );
});
