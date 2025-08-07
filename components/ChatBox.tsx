// src/ChatBox.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../app/types';

interface ChatBoxProps {
    socket: Socket | null;
    streamId: string | null;
    username: string;
    userId?: string;
    messages: ChatMessage[];
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, streamId, username, userId, messages }) => {
    const [chatInput, setChatInput] = useState('');
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to the latest message
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socket && streamId) {
            socket.emit('sendChatMessage', {
                streamId,
                message: chatInput,
                username,
                userId
            }, (response: any) => {
                if (response && !response.success) {
                    console.error('Failed to send message:', response.error);
                    alert(response.error || 'Failed to send message');
                }
            });
            setChatInput('');
        }
    };

    const getMessageStyle = (type: ChatMessage['type']): React.CSSProperties => {
        switch (type) {
            case 'system':
                return { color: '#888', fontStyle: 'italic' };
            case 'moderator':
                return { color: '#007bff', fontWeight: 'bold' };
            default:
                return {};
        }
    };

    return (
        <div style={styles.chatPanel}>
            <h3 style={styles.chatHeader}>Live Chat</h3>
            <div ref={chatHistoryRef} style={styles.chatHistory}>
                {messages.map((msg, index) => (
                    <div key={`${msg.id}-${index}-${msg.timestamp}`} style={{ ...styles.chatMessage, ...getMessageStyle(msg.type) }}>
                        <b>{msg.username}:</b> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendChat} style={styles.chatForm}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Say something..."
                    style={styles.chatInput}
                />
                <button type="submit" style={styles.chatButton}>Send</button>
            </form>
        </div>
    );
};

// Styles for the ChatBox component
const styles: { [key: string]: React.CSSProperties } = {
    chatPanel: { flex: 1, borderLeft: '1px solid #ccc', display: 'flex', flexDirection: 'column', padding: 10, backgroundColor: '#f9f9f9', height: '100%' },
    chatHeader: { textAlign: 'center', margin: '0 0 10px 0' },
    chatHistory: { flex: 1, overflowY: 'auto', marginBottom: 10, padding: 10, border: '1px solid #ddd', backgroundColor: 'white', borderRadius: 4 },
    chatMessage: { marginBottom: 8, wordBreak: 'break-word', lineHeight: '1.4' },
    chatForm: { display: 'flex' },
    chatInput: { flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' },
    chatButton: { marginLeft: 10, padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: 4, backgroundColor: '#007bff', color: 'white' }
};

export default ChatBox;