import express, { type Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import * as controller from "./message.controller.js";

const conversationMessageRouter = express.Router({ mergeParams: true });

conversationMessageRouter.post("/", asyncHandler(controller.send));
conversationMessageRouter.get("/", asyncHandler(controller.list));

export { conversationMessageRouter };
export const messageRouter = conversationMessageRouter as Router;
