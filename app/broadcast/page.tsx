"use client";
import React, { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import ChatBox from '../../components/ChatBox';
import ViewerCount from '../../components/ViewerCount';
import { ChatMessage } from '../types';

const SERVER_URL = 'http://localhost:4000';

const BroadcastPage: React.FC = () => {
    const [streamTitle, setStreamTitle] = useState('');
    const [broadcasterName, setBroadcasterName] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isInChat, setIsInChat] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [currentViewerCount, setCurrentViewerCount] = useState<number>(0);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const socketRef = useRef<Socket | null>(null);
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
    const videoProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
    const currentStreamIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Connect to the server on component mount
        socketRef.current = io(SERVER_URL);
        
        // Set up chat event listeners
        const socket = socketRef.current;
        
        socket.on('newChatMessage', ({ message }: { message: ChatMessage }) => {
            setChatMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(msg => msg.id === message.id);
                if (messageExists) {
                    return prev;
                }
                return [...prev, message];
            });
        });

        socket.on('userJoinedChat', ({ user, chatUsers }: { user: any; chatUsers: any[] }) => {
            console.log(`${user.username} joined the chat`);
        });

        socket.on('userLeftChat', ({ username }: { username: string }) => {
            console.log(`${username} left the chat`);
        });

        // Listen for stream end errors
        socket.on('streamStopError', (errorMessage: string) => {
            console.error('Failed to stop stream:', errorMessage);
            alert('Failed to stop stream: ' + errorMessage);
        });

        // Listen for stream started confirmation
        socket.on('streamStarted', (streamInfo: any) => {
            console.log('Stream started confirmation received:', streamInfo);
        });
        
        return () => {
            // Clean up on component unmount
            if (socketRef.current) {
                socketRef.current.off('newChatMessage');
                socketRef.current.off('userJoinedChat');
                socketRef.current.off('userLeftChat');
                socketRef.current.off('streamStopError');
                socketRef.current.off('streamStarted');
                socketRef.current.off('streamViewerCount');
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Set up viewer count listener when stream starts
    useEffect(() => {
        if (currentStreamId && socketRef.current) {
            console.log(`Setting up viewer count listener for stream: ${currentStreamId}`);
            
            const handleViewerCount = ({ streamId, count }: { streamId: string; count: number }) => {
                console.log(`Received viewer count update: streamId=${streamId}, count=${count}, currentStreamId=${currentStreamId}`);
                if (streamId === currentStreamId) {
                    setCurrentViewerCount(count);
                    console.log(`Broadcaster: Viewer count updated to ${count} for stream ${streamId}`);
                }
            };

            socketRef.current.on('streamViewerCount', handleViewerCount);

            return () => {
                console.log(`Cleaning up viewer count listener for stream: ${currentStreamId}`);
                if (socketRef.current) {
                    socketRef.current.off('streamViewerCount', handleViewerCount);
                }
            };
        }
    }, [currentStreamId]);

    const handleStartStream = async () => {
        if (!socketRef.current) return;
        const socket = socketRef.current;

        try {
            // 1. Get local media stream
            const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }

            // 2. Create a stream on the server
            socket.emit(
                'createStream',
                { title: streamTitle || 'Untitled Stream', broadcasterName: broadcasterName || 'Anonymous' },
                async ({ streamId }: { streamId: string }) => {
                    console.log('Stream created with ID:', streamId);

                    // 3. Get Router RTP Capabilities & Load Device
                    socket.emit('getRouterRtpCapabilities', async (routerRtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
                        const device = new mediasoupClient.Device();
                        await device.load({ routerRtpCapabilities });
                        deviceRef.current = device;

                        // 4. Create Producer Transport
                        socket.emit('createProducerTransport', { streamId }, async (transportInfo: mediasoupClient.types.TransportOptions) => {
                            const transport = device.createSendTransport(transportInfo);
                            producerTransportRef.current = transport;

                            // 5. Connect Producer Transport
                            transport.on('connect', ({ dtlsParameters }, callback) => {
                                socket.emit('connectProducerTransport', { streamId, dtlsParameters }, () => {
                                    callback();
                                });
                            });

                            // 6. Produce audio and video tracks
                            transport.on('produce', ({ kind, rtpParameters }, callback) => {
                                socket.emit('produce', { streamId, kind, rtpParameters }, ({ id }: { id: string }) => {
                                    callback({ id });
                                });
                            });

                            const audioTrack = localStream.getAudioTracks()[0];
                            const videoTrack = localStream.getVideoTracks()[0];

                            if (audioTrack) {
                                audioProducerRef.current = await transport.produce({ track: audioTrack });
                            }
                            if (videoTrack) {
                                videoProducerRef.current = await transport.produce({ track: videoTrack });
                            }

                            // 7. Announce the stream is live
                            socket.emit('startStream', { streamId });
                            setIsStreaming(true);
                            setCurrentStreamId(streamId);
                            currentStreamIdRef.current = streamId;
                            console.log(`Stream started with ID: ${streamId}, state updated`);
                            
                            // Join chat as the broadcaster
                            joinStreamChat(streamId, broadcasterName || 'Broadcaster');
                            
                            console.log('Stream is now live!');
                        });
                    });
                }
            );
        } catch (error) {
            console.error('Failed to start stream:', error);
            alert('Could not start stream. Check console for details.');
        }
    };

    const joinStreamChat = (streamId: string, username: string) => {
        if (!socketRef.current) return;
        
        // Clear existing messages before joining
        setChatMessages([]);
        
        const broadcasterId = 'broadcaster-' + streamId;
        setUserId(broadcasterId);
        
        socketRef.current.emit('joinChat', 
            { 
                streamId, 
                username, 
                userId: broadcasterId
            }, 
            (response: any) => {
                if (response.success) {
                    console.log('Successfully joined chat');
                    setIsInChat(true);
                    // Set recent messages, ensuring no duplicates
                    const recentMessages = response.recentMessages || [];
                    setChatMessages(recentMessages);
                } else {
                    console.error('Failed to join chat:', response.error);
                }
            }
        );
    };

    const handleEndStream = () => {
        if (!socketRef.current || !currentStreamId) return;

        // Stop local media streams
        if (localVideoRef.current?.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }

        // Close producers
        if (audioProducerRef.current && !audioProducerRef.current.closed) {
            audioProducerRef.current.close();
            audioProducerRef.current = null;
        }
        if (videoProducerRef.current && !videoProducerRef.current.closed) {
            videoProducerRef.current.close();
            videoProducerRef.current = null;
        }

        // Close producer transport
        if (producerTransportRef.current && !producerTransportRef.current.closed) {
            producerTransportRef.current.close();
            producerTransportRef.current = null;
        }

        // Leave chat
        if (isInChat) {
            socketRef.current.emit('leaveChat', { streamId: currentStreamId });
            setIsInChat(false);
            setChatMessages([]);
            setUserId('');
        }

        // Notify server to stop the stream
        socketRef.current.emit('stopStream', { streamId: currentStreamId });

        // Reset state
        setIsStreaming(false);
        setCurrentStreamId(null);
        currentStreamIdRef.current = null;
        setCurrentViewerCount(0);
        
        console.log('Stream ended successfully');
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ flex: 2, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h1>Broadcast a Livestream</h1>
                    {isStreaming && (
                        <ViewerCount 
                            count={currentViewerCount} 
                            isLive={true} 
                            variant="broadcast" 
                            size="large"
                        />
                    )}
                </div>
                <video ref={localVideoRef} width="640" height="480" autoPlay muted playsInline style={{ border: '1px solid black' }}></video>
                <br />
                <div style={{ margin: '10px 0' }}>
                    <input
                        type="text"
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        placeholder="Enter stream title"
                        disabled={isStreaming}
                        style={{ marginRight: '10px' }}
                    />
                    <input
                        type="text"
                        value={broadcasterName}
                        onChange={(e) => setBroadcasterName(e.target.value)}
                        placeholder="Enter your name"
                        disabled={isStreaming}
                    />
                </div>
                <button onClick={handleStartStream} disabled={isStreaming}>
                    {isStreaming ? 'Streaming...' : 'Start Stream'}
                </button>
                {isStreaming && (
                    <button 
                        onClick={handleEndStream} 
                        style={{ 
                            marginLeft: '10px', 
                            backgroundColor: '#dc3545', 
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        End Stream
                    </button>
                )}
            </div>
            
            {/* Chat Panel */}
            {isStreaming && isInChat && (
                <div style={{ flex: 1, height: '100vh' }}>
                    <ChatBox
                        socket={socketRef.current}
                        streamId={currentStreamId}
                        username={broadcasterName || 'Broadcaster'}
                        userId={userId}
                        messages={chatMessages}
                    />
                </div>
            )}
        </div>
    );
};

export default BroadcastPage;

// "use client";
// import React, { useState, useRef, useEffect } from 'react';
// import { io, Socket } from 'socket.io-client';
// import * as mediasoupClient from 'mediasoup-client';

// const SERVER_URL = 'http://localhost:4000';

// const BroadcastPage: React.FC = () => {
//     const [streamTitle, setStreamTitle] = useState('');
//     const [broadcasterName, setBroadcasterName] = useState('');
//     const [isStreaming, setIsStreaming] = useState(false);
//     const localVideoRef = useRef<HTMLVideoElement>(null);

//     const socketRef = useRef<Socket | null>(null);
//     const deviceRef = useRef<mediasoupClient.Device | null>(null);
//     const producerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
//     const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
//     const videoProducerRef = useRef<mediasoupClient.types.Producer | null>(null);

//     useEffect(() => {
//         // Connect to the server on component mount
//         socketRef.current = io(SERVER_URL);
//         return () => {
//             // Clean up on component unmount
//             socketRef.current?.disconnect();
//         };
//     }, []);

//     const handleStartStream = async () => {
//         if (!socketRef.current) return;
//         const socket = socketRef.current;

//         try {
//             // 1. Get local media stream
//             const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
//             if (localVideoRef.current) {
//                 localVideoRef.current.srcObject = localStream;
//             }

//             // 2. Create a stream on the server
//             socket.emit(
//                 'createStream',
//                 { title: streamTitle || 'Untitled Stream', broadcasterName: broadcasterName || 'Anonymous' },
//                 async ({ streamId }: { streamId: string }) => {
//                     console.log('Stream created with ID:', streamId);

//                     // 3. Get Router RTP Capabilities & Load Device
//                     socket.emit('getRouterRtpCapabilities', async (routerRtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
//                         const device = new mediasoupClient.Device();
//                         await device.load({ routerRtpCapabilities });
//                         deviceRef.current = device;

//                         // 4. Create Producer Transport
//                         socket.emit('createProducerTransport', { streamId }, async (transportInfo: mediasoupClient.types.TransportOptions) => {
//                             const transport = device.createSendTransport(transportInfo);
//                             producerTransportRef.current = transport;

//                             // 5. Connect Producer Transport
//                             transport.on('connect', ({ dtlsParameters }, callback) => {
//                                 socket.emit('connectProducerTransport', { streamId, dtlsParameters }, () => {
//                                     callback();
//                                 });
//                             });

//                             // 6. Produce audio and video tracks
//                             transport.on('produce', ({ kind, rtpParameters }, callback) => {
//                                 socket.emit('produce', { streamId, kind, rtpParameters }, ({ id }: { id: string }) => {
//                                     callback({ id });
//                                 });
//                             });

//                             const audioTrack = localStream.getAudioTracks()[0];
//                             const videoTrack = localStream.getVideoTracks()[0];

//                             if (audioTrack) {
//                                 audioProducerRef.current = await transport.produce({ track: audioTrack });
//                             }
//                             if (videoTrack) {
//                                 videoProducerRef.current = await transport.produce({ track: videoTrack });
//                             }

//                             // 7. Announce the stream is live
//                             socket.emit('startStream', { streamId });
//                             setIsStreaming(true);
//                             console.log('Stream is now live!');
//                         });
//                     });
//                 }
//             );
//         } catch (error) {
//             console.error('Failed to start stream:', error);
//             alert('Could not start stream. Check console for details.');
//         }
//     };

//     return (
//         <div>
//             <h1>Broadcast a Livestream</h1>
//             <video ref={localVideoRef} width="640" height="480" autoPlay muted playsInline style={{ border: '1px solid black' }}></video>
//             <br />
//             <div style={{ margin: '10px 0' }}>
//                 <input
//                     type="text"
//                     value={streamTitle}
//                     onChange={(e) => setStreamTitle(e.target.value)}
//                     placeholder="Enter stream title"
//                     disabled={isStreaming}
//                     style={{ marginRight: '10px' }}
//                 />
//                 <input
//                     type="text"
//                     value={broadcasterName}
//                     onChange={(e) => setBroadcasterName(e.target.value)}
//                     placeholder="Enter your name"
//                     disabled={isStreaming}
//                 />
//             </div>
//             <button onClick={handleStartStream} disabled={isStreaming}>
//                 {isStreaming ? 'Streaming...' : 'Start Stream'}
//             </button>
//         </div>
//     );
// };

// export default BroadcastPage;