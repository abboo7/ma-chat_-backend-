import type { RequestHandler } from "express";
import { flattenError, ZodError } from "zod";
import { AppError } from "../../lib/app-error.js";
import {
  createMessageSchema,
  listMessagesQuerySchema,
} from "./message.schema.js";
import { messageService } from "./message.service.js";

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

export const send: RequestHandler = async (req, res) => {
  try {
    const body = createMessageSchema.parse(req.body);
    const message = await messageService.send(
      getUserId(req),
      getParam(req.params.conversationId!),
      body
    );
    res.status(201).json(message);
  } catch (error) {
    handleError(error, res);
  }
};

export const list: RequestHandler = async (req, res) => {
  try {
    const query = listMessagesQuerySchema.parse(req.query);
    const result = await messageService.list(
      getUserId(req),
      getParam(req.params.conversationId!),
      query
    );
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
};
