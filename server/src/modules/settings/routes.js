
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { updateSettings, getSettings } from "./controllers.js";

const router = Router();

// View settings (public)
router.get("/", getSettings);

// Save settings (protected: settings.edit)
router.post("/save", requireAuth, requirePermission("settings.edit"), updateSettings);

export default router;
