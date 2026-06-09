import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { v1Router } from "./api/v1/index.js";

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

app.use("/api/v1", v1Router);

app.listen(env.PORT, () => {
  console.log(`API running at ${env.BETTER_AUTH_URL}`);
});
