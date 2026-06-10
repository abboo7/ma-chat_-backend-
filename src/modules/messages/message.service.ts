import type z from "zod";
import { AppError } from "../../lib/app-error.js";
import { conversationRepository } from "../conversations/conversation.repository.js";
import { conversationService } from "../conversations/conversation.service.js";
import {
  messageRepository,
  type MessageWithRelations,
} from "./message.repository.js";
import type { createMessageSchema } from "./message.schema.js";

type ReplyToPreview = {
  id: string;
  content: string | null;
  senderId: string | null;
  isDeleted: boolean;
};

function formatReplyTo(
  replyTo: MessageWithRelations["replyTo"]
): ReplyToPreview | null {
  if (!replyTo) {
    return null;
  }

  return {
    id: replyTo.id,
    content: replyTo.isDeleted ? null : replyTo.content,
    senderId: replyTo.senderId,
    isDeleted: replyTo.isDeleted,
  };
}

function formatMessage(message: MessageWithRelations) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: message.sender
      ? {
          id: message.sender.id,
          name: message.sender.name,
          image: message.sender.image,
        }
      : null,
    content: message.isDeleted ? null : message.content,
    type: message.type,
    replyToId: message.replyToId,
    replyTo: formatReplyTo(message.replyTo),
    isDeleted: message.isDeleted,
    deletedAt: message.deletedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

async function requireActiveMember(conversationId: string, userId: string) {
  const member = await conversationRepository.findActiveMember(
    conversationId,
    userId
  );

  if (!member?.isActive) {
    throw new AppError(404, "Conversation not found");
  }

  return member;
}

async function resolveConversationId(
  userId: string,
  conversationId: string,
  otherUserId?: string
): Promise<string> {
  const member = await conversationRepository.findActiveMember(
    conversationId,
    userId
  );

  if (member?.isActive) {
    return conversationId;
  }

  if (otherUserId) {
    const conversation = await conversationService.createDirect(
      userId,
      otherUserId
    );
    return conversation.id;
  }

  throw new AppError(404, "Conversation not found");
}

export const messageService = {
  async send(
    senderId: string,
    conversationId: string,
    body: z.infer<typeof createMessageSchema>
  ) {
    if (body.type === "SYSTEM") {
      throw new AppError(400, "Cannot send system messages");
    }

    const actualConvId = await resolveConversationId(
      senderId,
      conversationId,
      body.otherUserId
    );

    if (body.replyToId) {
      const parent = await messageRepository.findByIdInConversation(
        body.replyToId,
        actualConvId
      );

      if (!parent) {
        throw new AppError(404, "Reply target not found");
      }

      if (parent.isDeleted) {
        throw new AppError(400, "Cannot reply to a deleted message");
      }
    }

    const { otherUserId: _otherUserId, ...messageData } = body;
    const message = await messageRepository.create(
      senderId,
      actualConvId,
      messageData
    );

    return formatMessage(message);
  },

  async list(
    userId: string,
    conversationId: string,
    query: { limit: number; cursor?: string }
  ) {
    const member = await conversationRepository.findActiveMember(
      conversationId,
      userId
    );

    if (!member?.isActive) {
      return { messages: [], nextCursor: undefined };
    }

    const messages = await messageRepository.listByConversation(
      conversationId,
      {
        limit: query.limit + 1,
        cursor: query.cursor,
      }
    );

    const hasMore = messages.length > query.limit;
    const page = hasMore ? messages.slice(0, query.limit) : messages;

    return {
      messages: page.map(formatMessage),
      nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
    };
  },
};
