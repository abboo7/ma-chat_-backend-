import {
  ConversationType,
  MemberRole,
} from "../../../prisma/generated/client.js";
import { AppError } from "../../lib/app-error.js";
import {
  buildDirectKey,
  conversationRepository,
  type ConversationWithMembers,
} from "./conversation.repository.js";

function formatMember(member: ConversationWithMembers["members"][number]) {
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt,
    lastReadAt: member.lastReadAt,
    isActive: member.isActive,
    user: member.user,
  };
}

function formatConversation(conversation: ConversationWithMembers) {
  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    image: conversation.image,
    directKey: conversation.directKey,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    members: conversation.members.map(formatMember),
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

async function requireGroupRole(
  conversationId: string,
  userId: string,
  roles: MemberRole[]
) {
  const member = await requireActiveMember(conversationId, userId);

  if (!roles.includes(member.role)) {
    throw new AppError(403, "Insufficient permissions");
  }

  return member;
}

export const conversationService = {
  async createDirect(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new AppError(
        400,
        "Cannot create a direct conversation with yourself"
      );
    }

    const otherUser = await conversationRepository.findUserById(otherUserId);
    if (!otherUser) {
      throw new AppError(404, "User not found");
    }

    const directKey = buildDirectKey(userId, otherUserId);
    const existing = await conversationRepository.findByDirectKey(directKey);

    if (existing) {
      await Promise.all(
        [userId, otherUserId].map(async (memberId) => {
          const member = await conversationRepository.findActiveMember(
            existing.id,
            memberId
          );
          if (member && !member.isActive) {
            await conversationRepository.reactivateMember(
              existing.id,
              memberId
            );
          }
        })
      );

      const refreshed = await conversationRepository.findById(existing.id);
      if (!refreshed) {
        throw new AppError(500, "Failed to load conversation");
      }

      return formatConversation(refreshed);
    }

    const conversation = await conversationRepository.createDirect(
      userId,
      otherUserId,
      directKey
    );

    return formatConversation(conversation);
  },

  async createGroup(
    userId: string,
    data: { name: string; image?: string; memberIds?: string[] }
  ) {
    const memberIds = data.memberIds ?? [];

    if (memberIds.length > 0) {
      const users = await Promise.all(
        memberIds.map((id) => conversationRepository.findUserById(id))
      );

      const missing = memberIds.filter((_id, index) => !users[index]);
      if (missing.length > 0) {
        throw new AppError(404, `Users not found: ${missing.join(", ")}`);
      }
    }

    const conversation = await conversationRepository.createGroup(userId, {
      name: data.name,
      image: data.image,
      memberIds,
    });

    return formatConversation(conversation);
  },

  async list(userId: string, options: { cursor?: string; limit: number }) {
    const conversations = await conversationRepository.listForUser(userId, {
      limit: options.limit + 1,
      cursor: options.cursor,
    });

    const hasMore = conversations.length > options.limit;
    const page = hasMore
      ? conversations.slice(0, options.limit)
      : conversations;

    const items = await Promise.all(
      page.map(async (conversation) => {
        const unreadCount = await conversationRepository.countUnread(
          conversation.id,
          userId
        );
        return { ...formatConversation(conversation), unreadCount };
      })
    );

    return {
      conversations: items,
      nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
    };
  },

  async getById(userId: string, conversationId: string) {
    await requireActiveMember(conversationId, userId);

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new AppError(404, "Conversation not found");
    }

    const unreadCount = await conversationRepository.countUnread(
      conversationId,
      userId
    );

    return { ...formatConversation(conversation), unreadCount };
  },
};
