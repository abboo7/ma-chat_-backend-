import type { Prisma } from "../../../prisma/generated/client.js";
import { prisma } from "../../config/db.js";
import type { createMessageSchema } from "./message.schema.js";
import type z from "zod";

const senderSelect = {
  id: true,
  name: true,
  image: true,
} satisfies Prisma.UserSelect;

const replyToSelect = {
  id: true,
  content: true,
  senderId: true,
  isDeleted: true,
} satisfies Prisma.MessageSelect;

export const messageInclude = {
  sender: { select: senderSelect },
  replyTo: { select: replyToSelect },
} satisfies Prisma.MessageInclude;

export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

export const messageRepository = {
  async create(
    senderId: string,
    conversationId: string,
    message: z.infer<typeof createMessageSchema>
  ): Promise<MessageWithRelations> {
    const [created] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: message.content,
          type: message.type,
          replyToId: message.replyToId,
          senderId,
          conversationId,
        },
        include: messageInclude,
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return created;
  },

  async listByConversation(
    conversationId: string,
    options: { limit: number; cursor?: string }
  ): Promise<MessageWithRelations[]> {
    const cursorMessage = options.cursor
      ? await prisma.message.findUnique({
          where: { id: options.cursor },
          select: { id: true, createdAt: true },
        })
      : null;

    const where: Prisma.MessageWhereInput = {
      conversationId,
      ...(cursorMessage && {
        OR: [
          { createdAt: { lt: cursorMessage.createdAt } },
          {
            createdAt: cursorMessage.createdAt,
            id: { lt: cursorMessage.id },
          },
        ],
      }),
    };

    return prisma.message.findMany({
      take: options.limit,
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: messageInclude,
    });
  },

  async listReplies(
    parentId: string,
    options: { limit: number; cursor?: string }
  ): Promise<MessageWithRelations[]> {
    const cursorMessage = options.cursor
      ? await prisma.message.findUnique({
          where: { id: options.cursor },
          select: { id: true, createdAt: true },
        })
      : null;

    const where: Prisma.MessageWhereInput = {
      replyToId: parentId,
      isDeleted: false,
      ...(cursorMessage && {
        OR: [
          { createdAt: { gt: cursorMessage.createdAt } },
          {
            createdAt: cursorMessage.createdAt,
            id: { gt: cursorMessage.id },
          },
        ],
      }),
    };

    return prisma.message.findMany({
      take: options.limit,
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: messageInclude,
    });
  },

  async getById(messageId: string): Promise<MessageWithRelations | null> {
    return prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
  },

  async findByIdInConversation(
    messageId: string,
    conversationId: string
  ): Promise<MessageWithRelations | null> {
    return prisma.message.findFirst({
      where: { id: messageId, conversationId },
      include: messageInclude,
    });
  },

  async updateContent(
    messageId: string,
    content: string
  ): Promise<MessageWithRelations> {
    return prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: messageInclude,
    });
  },

  async softDelete(messageId: string): Promise<MessageWithRelations> {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
      },
      include: messageInclude,
    });
  },
};
