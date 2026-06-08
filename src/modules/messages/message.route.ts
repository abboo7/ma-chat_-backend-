import express, { type RequestHandler, type Router } from "express";

const todo: RequestHandler = (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
};

const conversationMessageRouter = express.Router({ mergeParams: true });

conversationMessageRouter.post("/", todo);
conversationMessageRouter.get("/", todo);

const messageByIdRouter = express.Router();

messageByIdRouter.get("/:messageId", todo);
messageByIdRouter.patch("/:messageId", todo);
messageByIdRouter.delete("/:messageId", todo);
messageByIdRouter.get("/:messageId/replies", todo);

export { conversationMessageRouter, messageByIdRouter };
