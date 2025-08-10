"use client";
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Use environment variable or fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_LIVESTREAM_SERVER_URL || "http://localhost:4000";

interface LiveStreamProps {
  role: "creator" | "audience";
  roomId: string;
  creatorName?: string;
  audienceName?: string;
}

export default function LiveStream({ role, roomId, creatorName, audienceName }: LiveStreamProps) {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Viewer-specific states
  const [device, setDevice] = useState<any>(null);
  const [consumerTransport, setConsumerTransport] = useState<any>(null);
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  const [isViewingStream, setIsViewingStream] = useState(false);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to livestream server as viewer');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from livestream server');
    });

    s.on('streamStarted', ({ streamId, title, broadcasterName }) => {
      console.log('Stream started:', { streamId, title, broadcasterName });
      if (streamId === roomId) {
        setStreamInfo({ streamId, title, broadcasterName });
        // Auto-join the stream if it matches our roomId
        joinStream();
      }
    });

    s.on('streamEnded', (endedStreamId) => {
      console.log('Stream ended:', endedStreamId);
      if (endedStreamId === roomId) {
        setIsViewingStream(false);
        setStreamInfo(null);
        cleanupViewing();
      }
    });

    s.on('newConsumer', async ({ producerId, id, kind, rtpParameters }) => {
      console.log('New consumer available:', { producerId, id, kind });
      if (consumerTransport && device) {
        try {
          const consumer = await consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters
          });

          setConsumers(prev => new Map(prev).set(consumer.id, consumer));
          
          // Handle the media stream
          const { track } = consumer;
          if (kind === 'video' && remoteVideoRef.current) {
            const stream = new MediaStream([track]);
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play().catch(console.error);
            console.log('Video consumer track attached');
          } else if (kind === 'audio' && remoteAudioRef.current) {
            const stream = new MediaStream([track]);
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.play().catch(console.error);
            console.log('Audio consumer track attached');
          }

          // Resume the consumer
          socket?.emit('resumeConsumer', { consumerId: consumer.id });
        } catch (error) {
          console.error('Error creating consumer:', error);
          setError('Failed to receive stream');
        }
      }
    });

    s.on('consumerClosed', ({ consumerId }) => {
      console.log('Consumer closed:', consumerId);
      const consumer = consumers.get(consumerId);
      if (consumer) {
        consumer.close();
        setConsumers(prev => {
          const newMap = new Map(prev);
          newMap.delete(consumerId);
          return newMap;
        });
      }
    });

    return () => {
      s.disconnect();
      cleanupViewing();
    };
  }, [roomId]);

  // Initialize mediasoup device for viewing
  useEffect(() => {
    if (!socket || !isConnected) return;

    const initializeDevice = async () => {
      try {
        const mediasoupClient = await import('mediasoup-client');
        const newDevice = new mediasoupClient.Device();

        socket.emit('getRouterRtpCapabilities', (routerRtpCapabilities: any) => {
          if (routerRtpCapabilities.error) {
            console.error('Error getting router capabilities:', routerRtpCapabilities.error);
            setError('Failed to initialize viewing capabilities');
            return;
          }

          newDevice.load({ routerRtpCapabilities }).then(() => {
            setDevice(newDevice);
            console.log('Mediasoup device initialized for viewing');
            
            // Check if stream is already active
            checkStreamStatus();
          }).catch((error: any) => {
            console.error('Error loading device:', error);
            setError('Failed to load viewing device');
          });
        });
      } catch (error) {
        console.error('Error importing mediasoup-client:', error);
        setError('Viewing not supported in this browser');
      }
    };

    initializeDevice();
  }, [socket, isConnected]);

  const checkStreamStatus = () => {
    if (!socket) return;
    
    socket.emit('getActiveStreams', (activeStreams: any[]) => {
      console.log('Active streams:', activeStreams);
      const targetStream = activeStreams.find(stream => stream.id === roomId);
      if (targetStream) {
        setStreamInfo(targetStream);
        // Auto-join if stream is active
        joinStream();
      }
    });
  };

  const joinStream = async () => {
    if (!socket || !device || !roomId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Joining stream:', roomId);
      
      // Join the stream
      socket.emit('joinStream', { streamId: roomId });
      
      // Create consumer transport
      socket.emit('createConsumerTransport', { streamId: roomId }, (params: any) => {
        if (params.error) {
          console.error('Error creating consumer transport:', params.error);
          setError('Failed to create viewing connection');
          return;
        }

        console.log('Consumer transport params received:', params);
        const transport = device.createRecvTransport(params);
        setConsumerTransport(transport);

        transport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
          console.log('Connecting consumer transport...');
          socket.emit('connectConsumerTransport', { 
            streamId: roomId, 
            dtlsParameters 
          }, (result: any) => {
            if (result && result.error) {
              console.error('Error connecting consumer transport:', result.error);
              errback(result.error);
            } else {
              console.log('Consumer transport connected');
              callback();
            }
          });
        });

        // Request to consume available producers
        socket.emit('consume', { streamId: roomId }, (result: any) => {
          if (result.error) {
            console.error('Error requesting consumption:', result.error);
            setError('Failed to start viewing stream');
          } else {
            console.log('Stream consumption started');
            setIsViewingStream(true);
          }
        });
      });
    } catch (error) {
      console.error('Error joining stream:', error);
      setError('Failed to join stream');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveStream = () => {
    if (socket && roomId) {
      socket.emit('leaveStream', { streamId: roomId });
    }
    cleanupViewing();
    setIsViewingStream(false);
  };

  const cleanupViewing = () => {
    console.log('Cleaning up viewing resources...');
    
    // Close all consumers
    consumers.forEach((consumer, id) => {
      console.log(`Closing consumer ${id}`);
      if (!consumer.closed) {
        consumer.close();
      }
    });
    setConsumers(new Map());

    // Close transport
    if (consumerTransport && !consumerTransport.closed) {
      console.log('Closing consumer transport');
      consumerTransport.close();
      setConsumerTransport(null);
    }

    // Clear video elements
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupViewing();
    };
  }, []);

  if (role === "creator") {
    return (
      <div className="text-center p-4">
        <p>Use the Stream Preview component for creator view</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={() => {
              console.log('Remote video metadata loaded');
            }}
            onError={(e) => {
              console.error('Remote video error:', e);
              setError('Video playback error');
            }}
          />
          
          {/* Remote Audio */}
          <audio
            ref={remoteAudioRef}
            autoPlay
          />

          {/* Stream Status Overlay */}
          {!isViewingStream && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {isLoading ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  )}
                </div>
                <p className="text-lg font-medium mb-2">
                  {error ? 'Stream Error' : isLoading ? 'Joining Stream...' : streamInfo ? `${streamInfo.title}` : 'Waiting for Stream'}
                </p>
                <p className="text-sm opacity-75 mb-4">
                  {error ? error : !isConnected ? 'Connecting to server...' : streamInfo ? `by ${streamInfo.broadcasterName}` : 'Stream will appear here when live'}
                </p>
                
                {!isLoading && !error && streamInfo && (
                  <Button onClick={joinStream} className="bg-white/20 hover:bg-white/30">
                    Join Stream
                  </Button>
                )}
                
                {!streamInfo && isConnected && (
                  <Button onClick={checkStreamStatus} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Check Stream Status
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Live Badge */}
          {isViewingStream && (
            <div className="absolute top-4 left-4">
              <Badge variant="destructive" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </Badge>
            </div>
          )}

          {/* Stream Info */}
          {isViewingStream && streamInfo && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-2 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{streamInfo.title}</p>
                    <p className="text-sm opacity-75">by {streamInfo.broadcasterName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={leaveStream}
                    className="text-white hover:bg-white/20"
                  >
                    Leave
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 