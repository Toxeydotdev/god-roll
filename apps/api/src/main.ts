import cors from "cors";
import express from "express";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

// Example API endpoint
app.get("/api", (_req, res) => {
  res.send({ message: "Welcome to god-roll API!" });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
