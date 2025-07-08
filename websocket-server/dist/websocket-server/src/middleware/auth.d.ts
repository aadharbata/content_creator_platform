import { Socket } from 'socket.io';
import { SocketData } from '../types/events';
export interface AuthenticatedSocket extends Socket {
    data: SocketData;
}
export declare function authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void>;
export declare const checkConversationAccess: (socket: AuthenticatedSocket, conversationId: string) => Promise<boolean>;
export declare const isValidUUID: (uuid: string) => boolean;
export declare const checkRateLimit: (socketId: string, maxRequests?: number, windowMs?: number) => boolean;
//# sourceMappingURL=auth.d.ts.map