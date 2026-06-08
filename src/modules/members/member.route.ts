import express, { type RequestHandler, type Router } from "express";

const router = express.Router({ mergeParams: true });

const todo: RequestHandler = (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
};

router.get("/", todo);
router.post("/", todo);
router.delete("/:userId", todo);
router.patch("/:userId/role", todo);

export const memberRouter = router as Router;
