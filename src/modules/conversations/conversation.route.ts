import express, { type RequestHandler, type Router } from "express";

const router = express.Router();

const todo: RequestHandler = (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
};

router.post("/direct", todo);
router.post("/group", todo);
router.get("/", todo);
router.get("/unread-count", todo);
router.get("/:conversationId", todo);
router.patch("/:conversationId", todo);
router.delete("/:conversationId", todo);
router.post("/:conversationId/read", todo);
router.get("/:conversationId/unread-count", todo);
router.post("/:conversationId/leave", todo);

export const conversationRouter = router as Router;
