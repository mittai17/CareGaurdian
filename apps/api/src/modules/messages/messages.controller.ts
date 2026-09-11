import { Controller, Get, Post, Body, Param, Query, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService, SendMessageDto } from './messages.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @Public()
  @ApiOperation({ summary: 'Get conversations for user' })
  async getConversations(@Query('userId') queryUserId?: string, @CurrentUser() user?: RequestUser) {
    // Default fallback to Dr. Vikram Malhotra if not logged in
    const activeUserId = user?.id || queryUserId || '2d3ebe91-7b85-4bd2-8306-9ec8295a89f0';
    const conversations = await this.messagesService.getConversations(activeUserId);
    return { data: conversations };
  }

  @Get('thread/:partnerId')
  @Public()
  @ApiOperation({ summary: 'Get message thread between active user and partner' })
  async getThread(
    @Param('partnerId') partnerId: string,
    @Query('userId') queryUserId?: string,
    @CurrentUser() user?: RequestUser
  ) {
    const activeUserId = user?.id || queryUserId || '2d3ebe91-7b85-4bd2-8306-9ec8295a89f0';
    const thread = await this.messagesService.getThread(activeUserId, partnerId);
    return { data: thread };
  }

  @Get('feed')
  @Public()
  @ApiOperation({ summary: 'Get all recent clinical messages feed' })
  async getFeed() {
    const feed = await this.messagesService.getAllRecent();
    return { data: feed };
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Body() dto: SendMessageDto & { senderId?: string },
    @CurrentUser() user?: RequestUser
  ) {
    const activeSenderId = user?.id || dto.senderId || '2d3ebe91-7b85-4bd2-8306-9ec8295a89f0';
    const sent = await this.messagesService.sendMessage(activeSenderId, dto);
    return { data: sent };
  }
}
