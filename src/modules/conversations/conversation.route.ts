import express, { type Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import * as controller from "./conversation.controller.js";

const router = express.Router();

router.post("/direct", asyncHandler(controller.createDirect));
router.post("/group", asyncHandler(controller.createGroup));
router.get("/", asyncHandler(controller.list));
router.get("/unread-count", asyncHandler(controller.getBatchUnreadCounts));
router.get("/:conversationId", asyncHandler(controller.getById));

export const conversationRouter = router as Router;
