import { z } from "zod";

export const createDirectSchema = z.object({
  userId: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.url().optional(),
  memberIds: z.array(z.string().min(1)).max(50).optional(),
});

export const updateConversationSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    image: z.url().nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.image !== undefined, {
    message: "At least one field is required",
  });

export const listConversationsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
