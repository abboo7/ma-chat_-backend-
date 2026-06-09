import type {
  Conversation,
  ConversationMember,
  Prisma,
} from "../../../prisma/generated/client.js";
import {
  ConversationType,
  MemberRole,
} from "../../../prisma/generated/client.js";
import { prisma } from "../../config/db.js";

const userSelect = {
  id: true,
  name: true,
  image: true,
} satisfies Prisma.UserSelect;

const memberInclude = {
  user: { select: userSelect },
} satisfies Prisma.ConversationMemberInclude;

const conversationInclude = {
  members: {
    where: { isActive: true },
    include: memberInclude,
  },
} satisfies Prisma.ConversationInclude;

export type ConversationWithMembers = Conversation & {
  members: (ConversationMember & {
    user: { id: string; name: string; image: string | null };
  })[];
};

export function buildDirectKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}

export const conversationRepository = {
  findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
  },

  findByDirectKey(directKey: string) {
    return prisma.conversation.findUnique({
      where: { directKey },
      include: conversationInclude,
    });
  },

  findById(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
  },

  findActiveMember(conversationId: string, userId: string) {
    return prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
  },

  async createDirect(
    userId: string,
    otherUserId: string,
    directKey: string
  ): Promise<ConversationWithMembers> {
    return prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        directKey,
        members: {
          create: [
            { userId, role: MemberRole.MEMBER },
            { userId: otherUserId, role: MemberRole.MEMBER },
          ],
        },
      },
      include: conversationInclude,
    });
  },

  async reactivateMember(conversationId: string, userId: string) {
    return prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        isActive: true,
        leftAt: null,
        joinedAt: new Date(),
      },
    });
  },

  async createGroup(
    ownerId: string,
    data: { name: string; image?: string; memberIds: string[] }
  ): Promise<ConversationWithMembers> {
    const uniqueMemberIds = [
      ...new Set(data.memberIds.filter((id) => id !== ownerId)),
    ];

    return prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        name: data.name,
        image: data.image,
        members: {
          create: [
            { userId: ownerId, role: MemberRole.OWNER },
            ...uniqueMemberIds.map((userId) => ({
              userId,
              role: MemberRole.MEMBER,
            })),
          ],
        },
      },
      include: conversationInclude,
    });
  },

  async listForUser(
    userId: string,
    options: { limit: number; cursor?: string }
  ): Promise<ConversationWithMembers[]> {
    const cursorConversation = options.cursor
      ? await prisma.conversation.findUnique({
          where: { id: options.cursor },
          select: { id: true, lastMessageAt: true, createdAt: true },
        })
      : null;

    const where: Prisma.ConversationWhereInput = {
      members: { some: { userId, isActive: true } },
    };

    if (cursorConversation) {
      const cursorDate =
        cursorConversation.lastMessageAt ?? cursorConversation.createdAt;
      where.AND = [
        {
          OR: [
            { lastMessageAt: { lt: cursorDate } },
            {
              lastMessageAt: cursorDate,
              id: { lt: cursorConversation.id },
            },
            {
              lastMessageAt: null,
              createdAt: { lt: cursorConversation.createdAt },
            },
          ],
        },
      ];
    }

    return prisma.conversation.findMany({
      where,
      include: conversationInclude,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: options.limit,
    });
  },
};
