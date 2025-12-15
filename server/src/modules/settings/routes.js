
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { saveSettings, getSettings } from "./controllers.js";

const router = Router();

// View settings (protected: settings.view)
router.get("/", requireAuth, requirePermission("settings.view"), getSettings);

// Save settings (protected: settings.edit)
router.post("/save", requireAuth, requirePermission("settings.edit"), saveSettings);

export default router;
