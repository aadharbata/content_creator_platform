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

interface WarningMessage {
    id: string;
    message: string;
    timestamp: Date;
    type: 'profanity' | 'rate_limit' | 'general';
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, streamId, username, userId, messages }) => {
    const [chatInput, setChatInput] = useState('');
    const [warnings, setWarnings] = useState<WarningMessage[]>([]);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const blockTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Auto-scroll to the latest message
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        // Listen for profanity warnings
        const handleProfanityWarning = (data: any) => {
            const warningMessage: WarningMessage = {
                id: `warning_${Date.now()}_${Math.random()}`,
                message: data.message,
                timestamp: new Date(),
                type: 'profanity'
            };
            
            setWarnings(prev => [...prev, warningMessage]);
            
            // Auto-remove warning after 10 seconds
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            warningTimeoutRef.current = setTimeout(() => {
                setWarnings(prev => prev.filter(w => w.id !== warningMessage.id));
            }, 10000);
        };

        // Listen for user being blocked due to excessive warnings
        const handleUserBlocked = (data: any) => {
            setIsBlocked(true);
            setBlockTimeRemaining(data.blockDuration || 300); // Default 5 minutes
            
            const warningMessage: WarningMessage = {
                id: `block_${Date.now()}_${Math.random()}`,
                message: data.message || 'You have been temporarily blocked from sending messages due to repeated violations.',
                timestamp: new Date(),
                type: 'general'
            };
            
            setWarnings(prev => [...prev, warningMessage]);

            // Start countdown timer
            if (blockTimerRef.current) {
                clearInterval(blockTimerRef.current);
            }
            
            blockTimerRef.current = setInterval(() => {
                setBlockTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsBlocked(false);
                        clearInterval(blockTimerRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        socket.on('profanityWarning', handleProfanityWarning);
        socket.on('userBlocked', handleUserBlocked);

        return () => {
            socket.off('profanityWarning', handleProfanityWarning);
            socket.off('userBlocked', handleUserBlocked);
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            if (blockTimerRef.current) {
                clearInterval(blockTimerRef.current);
            }
        };
    }, [socket]);

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isBlocked) {
            const warningMessage: WarningMessage = {
                id: `blocked_attempt_${Date.now()}`,
                message: `You are temporarily blocked. Please wait ${Math.floor(blockTimeRemaining / 60)}:${(blockTimeRemaining % 60).toString().padStart(2, '0')} before sending messages.`,
                timestamp: new Date(),
                type: 'general'
            };
            setWarnings(prev => [...prev, warningMessage]);
            
            setTimeout(() => {
                setWarnings(prev => prev.filter(w => w.id !== warningMessage.id));
            }, 5000);
            return;
        }
        
        if (chatInput.trim() && socket && streamId) {
            socket.emit('sendChatMessage', {
                streamId,
                message: chatInput,
                username,
                userId
            }, (response: any) => {
                if (response && !response.success) {
                    console.error('Failed to send message:', response.error);
                    
                    const warningMessage: WarningMessage = {
                        id: `error_${Date.now()}`,
                        message: response.error || 'Failed to send message',
                        timestamp: new Date(),
                        type: response.error?.includes('profanity') ? 'profanity' : 'general'
                    };
                    
                    setWarnings(prev => [...prev, warningMessage]);
                    
                    setTimeout(() => {
                        setWarnings(prev => prev.filter(w => w.id !== warningMessage.id));
                    }, 8000);
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

    const getWarningStyle = (type: WarningMessage['type']): React.CSSProperties => {
        switch (type) {
            case 'profanity':
                return { 
                    backgroundColor: '#ff4444', 
                    color: 'white', 
                    border: '1px solid #cc0000',
                    fontWeight: 'bold'
                };
            case 'rate_limit':
                return { 
                    backgroundColor: '#ff8800', 
                    color: 'white', 
                    border: '1px solid #cc6600' 
                };
            default:
                return { 
                    backgroundColor: '#ffaa00', 
                    color: 'white', 
                    border: '1px solid #cc8800' 
                };
        }
    };

    const dismissWarning = (warningId: string) => {
        setWarnings(prev => prev.filter(w => w.id !== warningId));
    };

    return (
        <div style={styles.chatPanel}>
            <h3 style={styles.chatHeader}>Live Chat</h3>
            
            {/* Warning Messages */}
            {warnings.length > 0 && (
                <div style={styles.warningContainer}>
                    {warnings.map((warning) => (
                        <div 
                            key={warning.id} 
                            style={{...styles.warningMessage, ...getWarningStyle(warning.type)}}
                        >
                            <div style={styles.warningContent}>
                                <strong>⚠️ Warning:</strong> {warning.message}
                            </div>
                            <button 
                                onClick={() => dismissWarning(warning.id)}
                                style={styles.dismissButton}
                                title="Dismiss warning"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div ref={chatHistoryRef} style={styles.chatHistory}>
                {messages.map((msg, index) => (
                    <div key={`msg-${msg.id}-${index}`} style={{ ...styles.chatMessage, ...getMessageStyle(msg.type) }}>
                        <b>{msg.username}:</b> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendChat} style={styles.chatForm}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isBlocked ? `Blocked for ${Math.floor(blockTimeRemaining / 60)}:${(blockTimeRemaining % 60).toString().padStart(2, '0')}` : "Say something..."}
                    style={{...styles.chatInput, ...(isBlocked ? styles.blockedInput : {})}}
                    disabled={isBlocked}
                />
                <button 
                    type="submit" 
                    style={{...styles.chatButton, ...(isBlocked ? styles.blockedButton : {})}}
                    disabled={isBlocked}
                >
                    {isBlocked ? 'Blocked' : 'Send'}
                </button>
            </form>
        </div>
    );
};

// Styles for the ChatBox component
const styles: { [key: string]: React.CSSProperties } = {
    chatPanel: { flex: 1, borderLeft: '1px solid #ccc', display: 'flex', flexDirection: 'column', padding: 10, backgroundColor: '#f9f9f9', height: '100%' },
    chatHeader: { textAlign: 'center', margin: '0 0 10px 0' },
    warningContainer: { marginBottom: 10 },
    warningMessage: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 8, 
        marginBottom: 5, 
        borderRadius: 4,
        fontSize: '14px',
        animation: 'slideIn 0.3s ease-out'
    },
    warningContent: { flex: 1 },
    dismissButton: { 
        background: 'rgba(255,255,255,0.3)', 
        border: 'none', 
        color: 'white', 
        fontSize: '16px', 
        fontWeight: 'bold',
        cursor: 'pointer', 
        padding: '2px 6px', 
        borderRadius: '50%',
        marginLeft: 8,
        minWidth: '24px',
        height: '24px'
    },
    chatHistory: { flex: 1, overflowY: 'auto', marginBottom: 10, padding: 10, border: '1px solid #ddd', backgroundColor: 'white', borderRadius: 4 },
    chatMessage: { marginBottom: 8, wordBreak: 'break-word', lineHeight: '1.4' },
    chatForm: { display: 'flex' },
    chatInput: { flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' },
    blockedInput: { backgroundColor: '#f0f0f0', color: '#666', cursor: 'not-allowed' },
    chatButton: { marginLeft: 10, padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: 4, backgroundColor: '#007bff', color: 'white' },
    blockedButton: { backgroundColor: '#ccc', cursor: 'not-allowed' }
};

export default ChatBox;