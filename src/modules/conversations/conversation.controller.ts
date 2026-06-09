import type { RequestHandler } from "express";
import { flattenError, ZodError } from "zod";
import { AppError } from "../../lib/app-error.js";
import {
  createDirectSchema,
  createGroupSchema,
  listConversationsQuerySchema,
  updateConversationSchema,
} from "./conversation.schema.js";
import { conversationService } from "./conversation.service.js";

function getUserId(req: Parameters<RequestHandler>[0]): string {
  const userId = req.session?.user.id;
  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }
  return userId;
}

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

function handleError(error: unknown, res: Parameters<RequestHandler>[1]) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: flattenError(error),
    });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

export const createDirect: RequestHandler = async (req, res) => {
  try {
    const body = createDirectSchema.parse(req.body);
    const conversation = await conversationService.createDirect(
      getUserId(req),
      body.userId
    );
    res.status(201).json(conversation);
  } catch (error) {
    handleError(error, res);
  }
};

export const createGroup: RequestHandler = async (req, res) => {
  try {
    const body = createGroupSchema.parse(req.body);
    const conversation = await conversationService.createGroup(getUserId(req), body);
    res.status(201).json(conversation);
  } catch (error) {
    handleError(error, res);
  }
};

export const list: RequestHandler = async (req, res) => {
  try {
    const query = listConversationsQuerySchema.parse(req.query);
    const result = await conversationService.list(getUserId(req), query);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const getBatchUnreadCounts: RequestHandler = async (req, res) => {
  try {
    const result = await conversationService.getBatchUnreadCounts(getUserId(req));
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const getById: RequestHandler = async (req, res) => {
  try {
    const conversation = await conversationService.getById(
      getUserId(req),
      getParam(req.params.conversationId!)
    );
    res.json(conversation);
  } catch (error) {
    handleError(error, res);
  }
};

export const update: RequestHandler = async (req, res) => {
  try {
    const body = updateConversationSchema.parse(req.body);
    const conversation = await conversationService.update(
      getUserId(req),
      getParam(req.params.conversationId!),
      body
    );
    res.json(conversation);
  } catch (error) {
    handleError(error, res);
  }
};

export const remove: RequestHandler = async (req, res) => {
  try {
    const result = await conversationService.delete(
      getUserId(req),
      getParam(req.params.conversationId!)
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const markAsRead: RequestHandler = async (req, res) => {
  try {
    const result = await conversationService.markAsRead(
      getUserId(req),
      getParam(req.params.conversationId!)
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const getUnreadCount: RequestHandler = async (req, res) => {
  try {
    const result = await conversationService.getUnreadCount(
      getUserId(req),
      getParam(req.params.conversationId!)
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};

export const leave: RequestHandler = async (req, res) => {
  try {
    const result = await conversationService.leave(
      getUserId(req),
      getParam(req.params.conversationId!)
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};
