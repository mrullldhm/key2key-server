import express from "express";
import passwordRouter from "./routes/password.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";
import { PORT } from "./config/env.js";

const app = express();

// Middleware (built-in)
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the key2key API server");
});

// Router
// app.use('/api/v1/auth', authRo)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/password", passwordRouter);

// Error Handller Middleware
app.use(errorMiddleware);

// Port listening
app.listen(PORT, () => {
  console.log(`The server is listening on http://localhost:${PORT}`);
});
