"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import ChatBox from '../../components/ChatBox';
import ViewerCount from '../../components/ViewerCount';
import { ChatMessage } from '../types';

export interface StreamListItem {
  id: string;
  title: string;
  broadcasterName: string;
  startTime: Date;
  viewerCount: number;
}
const SERVER_URL = 'http://localhost:4000';

const ViewerPage: React.FC = () => {
    const [streams, setStreams] = useState<StreamListItem[]>([]);
    const [selectedStream, setSelectedStream] = useState<StreamListItem | null>(null);
    const [viewerName, setViewerName] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isInChat, setIsInChat] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [currentViewerCount, setCurrentViewerCount] = useState<number>(0);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const socketRef = useRef<Socket | null>(null);
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const consumerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
    const selectedStreamRef = useRef<StreamListItem | null>(null);

    // Update ref whenever selectedStream changes
    useEffect(() => {
        selectedStreamRef.current = selectedStream;
    }, [selectedStream]);

    const handleLeaveStream = useCallback(() => {
        const currentStream = selectedStreamRef.current;
        if (!currentStream || !socketRef.current) return;

        // Stop remote video playback
        if (remoteVideoRef.current?.srcObject) {
            const stream = remoteVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            remoteVideoRef.current.srcObject = null;
        }

        // Close consumer transport
        if (consumerTransportRef.current && !consumerTransportRef.current.closed) {
            consumerTransportRef.current.close();
            consumerTransportRef.current = null;
        }

        // Leave chat
        socketRef.current.emit('leaveChat', { streamId: currentStream.id });
        setIsInChat(false);
        setChatMessages([]);
        setUserId('');

        // Notify server that we're leaving the stream
        socketRef.current.emit('leaveStream', { streamId: currentStream.id });

        // Reset state
        setSelectedStream(null);
        
        console.log('Left stream successfully');
    }, []);

    useEffect(() => {
        const socket = io(SERVER_URL);
        socketRef.current = socket;

        // Get initial list of streams
        socket.emit('getActiveStreams', (activeStreams: StreamListItem[]) => {
            setStreams(activeStreams);
        });

        // Listen for updates to the stream list
        socket.on('availableStreams', (activeStreams: StreamListItem[]) => {
            setStreams(activeStreams);
        });

        // Set up chat event listeners
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

        // Listen for stream end events
        socket.on('streamEnded', (endedStreamId: string) => {
            console.log('Stream ended:', endedStreamId);
            setStreams(prev => prev.filter(stream => stream.id !== endedStreamId));
            
            // If we're currently viewing the ended stream, automatically leave
            const currentStream = selectedStreamRef.current;
            if (currentStream && currentStream.id === endedStreamId) {
                console.log('Currently viewing stream that ended, auto-leaving...');
                alert('The stream you were watching has ended.');
                handleLeaveStream();
            }
        });

        // Listen for leave stream errors
        socket.on('leaveStreamError', (errorMessage: string) => {
            console.error('Failed to leave stream:', errorMessage);
            alert('Failed to leave stream: ' + errorMessage);
        });

        // Listen for viewer count updates
        socket.on('streamViewerCount', ({ streamId, count }: { streamId: string; count: number }) => {
            const currentStream = selectedStreamRef.current;
            if (currentStream && currentStream.id === streamId) {
                setCurrentViewerCount(count);
            }
        });

        return () => {
            if (socket) {
                // Leave any active stream before disconnecting
                const currentStream = selectedStreamRef.current;
                if (currentStream) {
                    socket.emit('leaveStream', { streamId: currentStream.id });
                    socket.emit('leaveChat', { streamId: currentStream.id });
                }
                
                socket.off('newChatMessage');
                socket.off('userJoinedChat');
                socket.off('userLeftChat');
                socket.off('availableStreams');
                socket.off('streamEnded');
                socket.off('leaveStreamError');
                socket.off('streamViewerCount');
                socket.disconnect();
            }
        };
    }, [handleLeaveStream]);

    const handleJoinStream = async (stream: StreamListItem) => {
        if (!socketRef.current) return;
        const socket = socketRef.current;

        setSelectedStream(stream);
        setCurrentViewerCount(stream.viewerCount); // Initialize with current count

        try {
            // 1. Join the stream room on the server
            socket.emit('joinStream', { streamId: stream.id });

            // 2. Get Router RTP Capabilities & Load Device
            socket.emit('getRouterRtpCapabilities', async (routerRtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
                const device = new mediasoupClient.Device();
                await device.load({ routerRtpCapabilities });
                deviceRef.current = device;

                // 3. Create Consumer Transport
                socket.emit('createConsumerTransport', { streamId: stream.id }, async (transportInfo: mediasoupClient.types.TransportOptions) => {
                    const transport = device.createRecvTransport(transportInfo);
                    consumerTransportRef.current = transport;

                    // 4. Connect Consumer Transport
                    transport.on('connect', ({ dtlsParameters }, callback) => {
                        socket.emit('connectConsumerTransport', { transportId: transport.id, dtlsParameters }, () => {
                            callback();
                        });
                    });

                    // 5. Consume the stream's producers
                    socket.emit(
                        'consume',
                        { streamId: stream.id, transportId: transport.id, rtpCapabilities: device.rtpCapabilities },
                        async (consumers: any[]) => {
                            const remoteStream = new MediaStream();

                            for (const consumerInfo of consumers) {
                                const consumer = await transport.consume({
                                    id: consumerInfo.id,
                                    producerId: consumerInfo.producerId,
                                    kind: consumerInfo.kind,
                                    rtpParameters: consumerInfo.rtpParameters,
                                });
                                remoteStream.addTrack(consumer.track);
                            }

                            if (remoteVideoRef.current) {
                                remoteVideoRef.current.srcObject = remoteStream;
                            }

                            // 6. Resume all consumers to start playback
                            socket.emit('resume', { transportId: transport.id }, (response?: any) => {
                                if (response && response.error) {
                                    console.error('Failed to resume consumers:', response.error);
                                } else {
                                    console.log('Successfully resumed consumers for playback');
                                }
                            });
                            
                            // Join chat as a viewer
                            joinStreamChat(stream.id, viewerName || `Viewer${Date.now()}`);
                        }
                    );
                });
            });
        } catch (error) {
            console.error('Failed to join stream:', error);
            alert('Could not join stream. Check console for details.');
        }
    };

    const joinStreamChat = (streamId: string, username: string) => {
        if (!socketRef.current) return;
        
        // Clear existing messages before joining
        setChatMessages([]);
        
        const viewerId = 'viewer-' + Date.now();
        setUserId(viewerId);
        
        socketRef.current.emit('joinChat', 
            { 
                streamId, 
                username, 
                userId: viewerId
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

    const handleBackToStreamList = () => {
        if (!selectedStream || !socketRef.current) return;

        // Leave chat when going back to stream list
        if (isInChat) {
            socketRef.current.emit('leaveChat', { streamId: selectedStream.id });
            setIsInChat(false);
            setChatMessages([]);
            setUserId('');
        }

        // Also notify server that we're leaving the stream
        socketRef.current.emit('leaveStream', { streamId: selectedStream.id });

        // Stop remote video if playing
        if (remoteVideoRef.current?.srcObject) {
            const stream = remoteVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            remoteVideoRef.current.srcObject = null;
        }

        // Close consumer transport
        if (consumerTransportRef.current && !consumerTransportRef.current.closed) {
            consumerTransportRef.current.close();
            consumerTransportRef.current = null;
        }

        setSelectedStream(null);
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ flex: selectedStream ? 2 : 1, padding: '20px' }}>
                <h1>Available Livestreams</h1>
                {!selectedStream ? (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                value={viewerName}
                                onChange={(e) => setViewerName(e.target.value)}
                                placeholder="Enter your name (optional)"
                                style={{ padding: '8px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {streams.map((stream) => (
                                <li 
                                    key={stream.id} 
                                    onClick={() => handleJoinStream(stream)} 
                                    style={{ 
                                        cursor: 'pointer', 
                                        padding: '15px', 
                                        margin: '10px 0', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '8px',
                                        backgroundColor: '#f9f9f9',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ fontSize: '16px', color: '#333' }}>{stream.title}</strong>
                                            <div style={{ color: '#666', marginTop: '4px' }}>
                                                by {stream.broadcasterName}
                                            </div>
                                        </div>
                                        <ViewerCount count={stream.viewerCount} variant="viewer" size="small" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2>Now Viewing: {selectedStream.title}</h2>
                            <ViewerCount count={currentViewerCount} variant="viewer" />
                        </div>
                        <video ref={remoteVideoRef} width="640" height="480" autoPlay playsInline style={{ border: '1px solid black' }}></video>
                        <br />
                        <button onClick={handleBackToStreamList} style={{ marginTop: '10px', marginRight: '10px' }}>
                            Back to Stream List
                        </button>
                        <button 
                            onClick={handleLeaveStream} 
                            style={{ 
                                marginTop: '10px',
                                backgroundColor: '#dc3545', 
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Leave Stream
                        </button>
                    </div>
                )}
            </div>
            
            {/* Chat Panel */}
            {selectedStream && isInChat && (
                <div style={{ flex: 1, height: '100vh' }}>
                    <ChatBox
                        socket={socketRef.current}
                        streamId={selectedStream.id}
                        username={viewerName || `Viewer${Date.now()}`}
                        userId={userId}
                        messages={chatMessages}
                    />
                </div>
            )}
        </div>
    );
};

export default ViewerPage;

// "use client";
// import React, { useState, useRef, useEffect } from 'react';
// import { io, Socket } from 'socket.io-client';
// import * as mediasoupClient from 'mediasoup-client';

// export interface StreamListItem {
//   id: string;
//   title: string;
//   broadcasterName: string;
//   startTime: Date;
//   viewerCount: number;
// }
// const SERVER_URL = 'http://localhost:4000';

// const ViewerPage: React.FC = () => {
//     const [streams, setStreams] = useState<StreamListItem[]>([]);
//     const [selectedStream, setSelectedStream] = useState<StreamListItem | null>(null);
//     const remoteVideoRef = useRef<HTMLVideoElement>(null);

//     const socketRef = useRef<Socket | null>(null);
//     const deviceRef = useRef<mediasoupClient.Device | null>(null);
//     const consumerTransportRef = useRef<mediasoupClient.types.Transport | null>(null);

//     useEffect(() => {
//         const socket = io(SERVER_URL);
//         socketRef.current = socket;

//         // Get initial list of streams
//         socket.emit('getActiveStreams', (activeStreams: StreamListItem[]) => {
//             setStreams(activeStreams);
//         });

//         // Listen for updates to the stream list
//         socket.on('availableStreams', (activeStreams: StreamListItem[]) => {
//             setStreams(activeStreams);
//         });

//         return () => {
//             socket.disconnect();
//         };
//     }, []);

//     const handleJoinStream = async (stream: StreamListItem) => {
//         if (!socketRef.current) return;
//         const socket = socketRef.current;

//         setSelectedStream(stream);

//         try {
//             // 1. Join the stream room on the server
//             socket.emit('joinStream', { streamId: stream.id });

//             // 2. Get Router RTP Capabilities & Load Device
//             socket.emit('getRouterRtpCapabilities', async (routerRtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
//                 const device = new mediasoupClient.Device();
//                 await device.load({ routerRtpCapabilities });
//                 deviceRef.current = device;

//                 // 3. Create Consumer Transport
//                 socket.emit('createConsumerTransport', { streamId: stream.id }, async (transportInfo: mediasoupClient.types.TransportOptions) => {
//                     const transport = device.createRecvTransport(transportInfo);
//                     consumerTransportRef.current = transport;

//                     // 4. Connect Consumer Transport
//                     transport.on('connect', ({ dtlsParameters }, callback) => {
//                         socket.emit('connectConsumerTransport', { transportId: transport.id, dtlsParameters }, () => {
//                             callback();
//                         });
//                     });

//                     // 5. Consume the stream's producers
//                     socket.emit(
//                         'consume',
//                         { streamId: stream.id, transportId: transport.id, rtpCapabilities: device.rtpCapabilities },
//                         async (consumers: any[]) => {
//                             const remoteStream = new MediaStream();

//                             for (const consumerInfo of consumers) {
//                                 const consumer = await transport.consume({
//                                     id: consumerInfo.id,
//                                     producerId: consumerInfo.producerId,
//                                     kind: consumerInfo.kind,
//                                     rtpParameters: consumerInfo.rtpParameters,
//                                 });
//                                 remoteStream.addTrack(consumer.track);
//                             }

//                             if (remoteVideoRef.current) {
//                                 remoteVideoRef.current.srcObject = remoteStream;
//                             }

//                             // 6. Resume all consumers to start playback
//                             socket.emit('resume', { transportId: transport.id });
//                         }
//                     );
//                 });
//             });
//         } catch (error) {
//             console.error('Failed to join stream:', error);
//             alert('Could not join stream. Check console for details.');
//         }
//     };

//     return (
//         <div>
//             <h1>Available Livestreams</h1>
//             {!selectedStream ? (
//                 <ul>
//                     {streams.map((stream) => (
//                         <li key={stream.id} onClick={() => handleJoinStream(stream)} style={{ cursor: 'pointer' }}>
//                             {stream.title} by {stream.broadcasterName} ({stream.viewerCount} viewers)
//                         </li>
//                     ))}
//                 </ul>
//             ) : (
//                 <div>
//                     <h2>Now Viewing: {selectedStream.title}</h2>
//                     <video ref={remoteVideoRef} width="640" height="480" autoPlay playsInline style={{ border: '1px solid black' }}></video>
//                     <br />
//                     <button onClick={() => setSelectedStream(null)}>Back to Stream List</button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ViewerPage;