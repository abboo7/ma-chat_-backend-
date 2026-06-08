import express from "express";

import { requireAuth } from "../../middleware/require-auth.js";
import { conversationRouter } from "../../modules/conversations/conversation.route.js";
import {
  conversationMessageRouter,
  messageByIdRouter,
} from "../../modules/messages/message.route.js";
import { memberRouter } from "../../modules/members/member.route.js";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

router.use(express.json());

const protectedRouter = express.Router();

protectedRouter.use(requireAuth);
protectedRouter.use("/conversations", conversationRouter);
protectedRouter.use(
  "/conversations/:conversationId/messages",
  conversationMessageRouter
);
protectedRouter.use(
  "/conversations/:conversationId/members",
  memberRouter
);
protectedRouter.use("/messages", messageByIdRouter);

router.use(protectedRouter);

export const v1Router = router;
