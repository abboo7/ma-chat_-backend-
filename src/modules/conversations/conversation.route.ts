import express, { type Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import * as controller from "./conversation.controller.js";

const router = express.Router();

router.post("/direct", asyncHandler(controller.createDirect));
router.post("/group", asyncHandler(controller.createGroup));
router.get("/", asyncHandler(controller.list));
router.get("/unread-count", asyncHandler(controller.getBatchUnreadCounts));
router.get("/:conversationId", asyncHandler(controller.getById));
router.patch("/:conversationId", asyncHandler(controller.update));
router.delete("/:conversationId", asyncHandler(controller.remove));
router.post("/:conversationId/read", asyncHandler(controller.markAsRead));
router.get(
  "/:conversationId/unread-count",
  asyncHandler(controller.getUnreadCount)
);
router.post("/:conversationId/leave", asyncHandler(controller.leave));

export const conversationRouter = router as Router;
