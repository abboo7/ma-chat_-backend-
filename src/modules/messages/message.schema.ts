import { z } from "zod";

const messageTypeSchema = z.enum([
  "TEXT",
  "IMAGE",
  "VIDEO",
  "FILE",
  "SYSTEM",
]);

export const createMessageSchema = z
  .object({
    content: z.string().min(1).max(4000),
    type: messageTypeSchema.default("TEXT"),
    replyToId: z.string().min(1).optional(),
    otherUserId: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "TEXT" && !data.content) {
      ctx.addIssue({
        code: "custom",
        message: "content is required",
        path: ["content"],
      });
    }
  });

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const listMessagesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
