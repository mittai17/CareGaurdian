import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendMessageDto {
  receiverId: string;
  content: string;
  patientId?: string;
  attachments?: any;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    // Find all messages involving user
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        receiver: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const partnerMap = new Map<string, any>();

    for (const msg of messages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!partner) continue;

      if (!partnerMap.has(partner.id)) {
        partnerMap.set(partner.id, {
          partnerId: partner.id,
          name: partner.name,
          handle: partner.handle,
          roles: partner.roles,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          patient: msg.patient ? `${msg.patient.firstName} ${msg.patient.lastName}` : null,
          patientId: msg.patientId,
          unreadCount: msg.receiverId === userId && msg.status !== 'READ' ? 1 : 0,
        });
      }
    }

    return Array.from(partnerMap.values());
  }

  async getThread(userId: string, partnerId: string) {
    // Mark incoming messages as read
    await this.prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });

    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        receiver: {
          select: { id: true, name: true, handle: true, roles: true },
        },
      },
    });
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException(`Recipient with ID ${dto.receiverId} not found`);
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        patientId: dto.patientId || null,
        content: dto.content,
        attachmentType: dto.attachments?.type || null,
        attachmentTitle: dto.attachments?.title || null,
        attachmentDetail: dto.attachments?.detail || null,
        status: 'DELIVERED',
      },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        receiver: {
          select: { id: true, name: true, handle: true, roles: true },
        },
      },
    });
  }

  async getAllRecent() {
    return this.prisma.message.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        receiver: {
          select: { id: true, name: true, handle: true, roles: true },
        },
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
