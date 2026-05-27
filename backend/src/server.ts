import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import vaultRoutes from "./routes/vaults.js";
import memorialRoutes from "./routes/memorials.js";
import publicMemorialRoutes from "./routes/publicMemorials.js";
import accountRoutes from "./routes/account.js";
import billingRoutes from "./routes/billing.js";
import legacyRoutes from "./routes/legacy.js";
import adminRoutes from "./routes/admin.js";
import ogRoutes from "./routes/og.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(apiRateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "presence-backend" });
});

app.use("/auth", authRoutes);
app.use("/vaults", vaultRoutes);
app.use("/memorials", memorialRoutes);
app.use("/m", publicMemorialRoutes);
app.use("/account", accountRoutes);
app.use("/billing", billingRoutes);
app.use("/legacy", legacyRoutes);
app.use("/admin", adminRoutes);
app.use("/og", ogRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[presence-backend] listening on :${env.PORT} (${env.NODE_ENV})`);
});
