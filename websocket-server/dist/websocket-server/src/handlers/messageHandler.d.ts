import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middleware/auth';
export declare class MessageHandler {
    private io;
    private profanityFilter;
    constructor(io: Server);
    handleAutoJoinCommunities(socket: AuthenticatedSocket): Promise<void>;
    handleSendMessage(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleJoinConversation(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleLeaveConversation(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleTypingStart(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleTypingStop(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleMarkAsRead(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleSendCommunityMessage(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleCommunityTypingStart(socket: AuthenticatedSocket, data: unknown): Promise<void>;
    handleCommunityTypingStop(socket: AuthenticatedSocket, data: unknown): Promise<void>;
}
//# sourceMappingURL=messageHandler.d.ts.map