import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { auth } from "./config/auth.js";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(env.PORT, () => {
  console.log(`API running at ${env.BETTER_AUTH_URL}`);
});
