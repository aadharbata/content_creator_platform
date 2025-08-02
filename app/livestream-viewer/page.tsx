"use client";
import React, { useRef, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { LiveStreamChat } from '@/components/livestream/LiveStreamChat';

interface StreamInfo {
  id: string;
  title: string;
  broadcasterName: string;
  startTime: string;
  viewerCount: number;
}

const LivestreamViewer: React.FC = () => {
  const [availableStreams, setAvailableStreams] = useState<StreamInfo[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [currentStreamInfo, setCurrentStreamInfo] = useState<StreamInfo | null>(null);
  const [viewerName, setViewerName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const consumerTransportRef = useRef<any>(null);

  // Socket event listeners
  useEffect(() => {
    console.log('Setting up viewer socket listeners...');
    
    // Initialize socket connection
    socketRef.current = io('http://localhost:4000');
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      console.log('Viewer socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Viewer socket disconnected');
      setIsConnected(false);
      // Force clear loading state on disconnect
      setIsLoading(false);
      setLoadingStatus('');
      // Clean up viewing state on disconnect
      stopViewing();
    });

    socket.on('availableStreams', (streams: StreamInfo[]) => {
      console.log('Available streams updated:', streams);
      setAvailableStreams(streams);
    });

    socket.on('streamStarted', (streamInfo: StreamInfo) => {
      console.log('New stream started:', streamInfo);
      setAvailableStreams(prev => {
        const existing = prev.find(s => s.id === streamInfo.id);
        if (existing) {
          return prev.map(s => s.id === streamInfo.id ? streamInfo : s);
        }
        return [...prev, streamInfo];
      });
    });

    socket.on('streamEnded', (streamId: string) => {
      console.log('Stream ended:', streamId);
      setAvailableStreams(prev => prev.filter(s => s.id !== streamId));
      
      // Check if we were viewing this stream
      setSelectedStreamId(currentSelectedStreamId => {
        if (currentSelectedStreamId === streamId) {
          setIsViewing(currentIsViewing => {
            if (currentIsViewing) {
              stopViewing();
            }
            return false;
          });
          return null;
        }
        return currentSelectedStreamId;
      });
    });

    socket.on('streamViewerCount', ({ streamId, count }: { streamId: string; count: number }) => {
      console.log('Stream viewer count updated:', streamId, count);
      setAvailableStreams(prev => 
        prev.map(stream => 
          stream.id === streamId ? { ...stream, viewerCount: count } : stream
        )
      );
      
      // Update current stream info if we're viewing this stream
      setCurrentStreamInfo(prev => {
        if (prev && prev.id === streamId) {
          return { ...prev, viewerCount: count };
        }
        return prev;
      });
    });

    return () => {
      console.log('Cleaning up viewer socket listeners...');
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('availableStreams');
        socket.off('streamStarted');
        socket.off('streamEnded');
        socket.off('streamViewerCount');
        
        // Clean up any active viewing session
        if (consumerTransportRef.current) {
          consumerTransportRef.current.close();
          consumerTransportRef.current = null;
        }
        
        // Clean up video
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          const stream = remoteVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          remoteVideoRef.current.srcObject = null;
        }
        
        socket.disconnect();
      }
    };
  }, []);

  const joinStream = async (streamId: string) => {
    try {
      if (!isConnected || !socketRef.current) {
        alert('Not connected to server. Please wait and try again.');
        return;
      }

      const streamInfo = availableStreams.find(s => s.id === streamId);
      if (!streamInfo) {
        alert('Stream not found or no longer available.');
        return;
      }
      
      setIsLoading(true);
      setLoadingStatus('Connecting to stream...');
      setSelectedStreamId(streamId);
      setCurrentStreamInfo(streamInfo);
      console.log('Joining stream:', streamId);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('Stream join timeout after 30 seconds');
        setIsLoading(false);
        setLoadingStatus('');
        alert('Failed to join stream: Connection timeout. Please try again.');
      }, 30000);
      
      socketRef.current.emit('getRouterRtpCapabilities', async (rtpCapabilities: any) => {
        try {
          if (!rtpCapabilities) {
            console.error('No RTP capabilities received');
            clearTimeout(timeoutId);
            setIsLoading(false);
            setLoadingStatus('');
            alert('Failed to get router capabilities from server');
            return;
          }
          
          setLoadingStatus('Setting up media device...');
          console.log('Received RTP capabilities for viewing');
          deviceRef.current = new Device();
          await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
          console.log('MediaSoup device loaded for viewing');

          socketRef.current!.emit('createConsumerTransport', { streamId }, async (transportInfo: any) => {
            try {
              if (transportInfo.error) {
                console.error('Error creating consumer transport:', transportInfo.error);
                clearTimeout(timeoutId);
                setIsLoading(false);
                setLoadingStatus('');
                alert('Failed to create consumer transport: ' + transportInfo.error);
                return;
              }

              if (!transportInfo.id) {
                console.error('No transport ID received');
                clearTimeout(timeoutId);
                setIsLoading(false);
                setLoadingStatus('');
                alert('Invalid transport information received from server');
                return;
              }

              setLoadingStatus('Creating transport connection...');
              console.log('Received consumer transport info');
              consumerTransportRef.current = deviceRef.current!.createRecvTransport(transportInfo);
              console.log('Consumer transport created');

              consumerTransportRef.current.on(
                'connect',
                async ({ dtlsParameters }: any, callback: any, errback: any) => {
                  console.log('Consumer transport connecting...');
                  socketRef.current!.emit(
                    'connectConsumerTransport',
                    { transportId: consumerTransportRef.current!.id, dtlsParameters },
                    (response: any) => {
                      if (response?.error) {
                        console.error('Error connecting consumer transport:', response.error);
                        clearTimeout(timeoutId);
                        setIsLoading(false);
                        setLoadingStatus('');
                        errback(new Error(response.error));
                      } else {
                        console.log('Consumer transport connected');
                        setLoadingStatus('Transport connected, requesting media...');
                        callback();
                      }
                    }
                  );
                }
              );

              consumerTransportRef.current.on('connectionstatechange', (state: string) => {
                console.log('Consumer transport connection state:', state);
                if (state === 'failed' || state === 'disconnected') {
                  console.error('Consumer transport connection failed');
                  clearTimeout(timeoutId);
                  setIsLoading(false);
                  alert('Transport connection failed. Please try again.');
                }
              });

              // Create a MediaStream to hold both video and audio tracks
              const remoteStream = new MediaStream();
              console.log('Created new MediaStream for remote video');
              
              setLoadingStatus('Setting up video stream...');
              
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.autoplay = true;
                remoteVideoRef.current.playsInline = true;
                remoteVideoRef.current.muted = false;
                console.log('Assigned MediaStream to video element');
              } else {
                console.error('Remote video element not found!');
              }

              // Consume all available tracks (video and audio) for this stream
              socketRef.current!.emit(
                'consume',
                { 
                  streamId,
                  transportId: consumerTransportRef.current!.id, 
                  rtpCapabilities: deviceRef.current!.rtpCapabilities 
                },
                async (consumeResults: any) => {
                  try {
                    if (consumeResults.error) {
                      console.error('Error consuming:', consumeResults.error);
                      clearTimeout(timeoutId);
                      setIsLoading(false);
                      alert('Failed to consume stream: ' + consumeResults.error);
                      return;
                    }
                    
                    console.log('Received consume results:', consumeResults);
                    
                    // Handle array of consume results
                    if (Array.isArray(consumeResults) && consumeResults.length > 0) {
                      for (const params of consumeResults) {
                        if (!params || !params.id) {
                          console.error('Invalid consume params received:', params);
                          continue;
                        }
                        
                        try {
                          const consumer = await consumerTransportRef.current!.consume(params);
                          const { track } = consumer;
                          
                          // Add track to the remote stream
                          remoteStream.addTrack(track);
                          console.log('Added', params.kind, 'track to remote stream');
                          
                          // Set up event handlers for the consumer
                          consumer.on('trackended', () => {
                            console.log(`Consumer track ended: ${consumer.id} (${consumer.kind})`);
                          });
                          
                          consumer.on('transportclose', () => {
                            console.log(`Consumer transport closed: ${consumer.id} (${consumer.kind})`);
                          });
                        } catch (consumerError) {
                          console.error('Error creating consumer:', consumerError);
                        }
                      }
                      
                      // Ensure video element is properly set up
                      if (remoteVideoRef.current && remoteStream.getTracks().length > 0) {
                        console.log(`Setting up video element with ${remoteStream.getTracks().length} tracks`);
                        remoteVideoRef.current.srcObject = remoteStream;
                        
                        // Add event listeners for debugging
                        remoteVideoRef.current.onloadedmetadata = () => {
                          console.log('Video metadata loaded');
                        };
                        
                        remoteVideoRef.current.oncanplay = () => {
                          console.log('Video can start playing');
                        };
                        
                        remoteVideoRef.current.onplay = () => {
                          console.log('Video started playing');
                        };
                        
                        remoteVideoRef.current.onerror = (error) => {
                          console.error('Video element error:', error);
                        };
                        
                        // Try to play the video
                        try {
                          await remoteVideoRef.current.play();
                          console.log('Video play initiated successfully');
                        } catch (playError) {
                          console.warn('Auto-play failed (this is normal in some browsers):', playError);
                        }
                      } else {
                        console.warn('No tracks added to remote stream or video element not found');
                      }
                      
                      // Resume the consumers to start receiving media
                      socketRef.current!.emit('resume', { transportId: consumerTransportRef.current!.id }, (response: any) => {
                        clearTimeout(timeoutId);
                        if (response?.error) {
                          console.error('Error resuming consumers:', response.error);
                          setIsLoading(false);
                          setLoadingStatus('');
                          alert('Failed to resume media playback: ' + response.error);
                          return;
                        }
                        console.log('Consumers resumed, media should start flowing');
                        
                        // Set viewing state
                        setIsViewing(true);
                        setIsLoading(false);
                        setLoadingStatus('');
                        
                        // Notify server that viewer joined
                        socketRef.current!.emit('joinStream', { streamId });
                        console.log('Successfully started viewing stream');
                      });
                      
                    } else {
                      console.warn('No consumers available');
                      clearTimeout(timeoutId);
                      setIsLoading(false);
                      alert('No video/audio tracks available from the broadcaster.');
                    }
                  } catch (error) {
                    console.error('Error in consume results handling:', error);
                    clearTimeout(timeoutId);
                    setIsLoading(false);
                    alert('Error processing stream data: ' + (error as Error).message);
                  }
                }
              );
            } catch (error) {
              console.error('Error in createConsumerTransport:', error);
              clearTimeout(timeoutId);
              setIsLoading(false);
              alert('Error creating consumer transport: ' + (error as Error).message);
            }
          });
        } catch (error) {
          console.error('Error in getRouterRtpCapabilities:', error);
          clearTimeout(timeoutId);
          setIsLoading(false);
          alert('Error getting router capabilities: ' + (error as Error).message);
        }
      });
    } catch (error) {
      console.error('Error joining stream:', error);
      setIsViewing(false);
      setIsLoading(false);
      alert('Error joining stream: ' + (error as Error).message);
    }
  };

  const stopViewing = () => {
    console.log('Stopping viewing...');
    
    // Store current selectedStreamId to avoid closure issues
    const currentStreamId = selectedStreamId;
    
    // Stop video playback
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
      remoteVideoRef.current.srcObject = null;
    }

    // Close transport
    if (consumerTransportRef.current) {
      consumerTransportRef.current.close();
      consumerTransportRef.current = null;
      console.log('Consumer transport closed');
    }

    // Notify server only if we were actually viewing a stream
    if (currentStreamId && socketRef.current && isViewing) {
      socketRef.current.emit('leaveStream', { streamId: currentStreamId });
      console.log('Sent leaveStream event for stream:', currentStreamId);
    }
    
    setIsViewing(false);
    setIsLoading(false);
    setLoadingStatus('');
    setSelectedStreamId(null);
    setCurrentStreamInfo(null);
    console.log('Stopped viewing successfully');
  };

  const refreshStreams = () => {
    if (socketRef.current) {
      socketRef.current.emit('getActiveStreams', (streams: StreamInfo[]) => {
        setAvailableStreams(streams);
      });
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <h1>👁️ Live Stream Viewer</h1>
      
      {/* Name Input Form */}
      {!isNameSet && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '12px',
          border: '2px solid #dee2e6',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h2>Enter Your Name</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Choose a display name to participate in live chat
          </p>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <input
              type="text"
              value={viewerName}
              onChange={(e) => setViewerName(e.target.value)}
              placeholder="Enter your name..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
              maxLength={30}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && viewerName.trim()) {
                  setIsNameSet(true);
                }
              }}
            />
            <button
              onClick={() => setIsNameSet(true)}
              disabled={!viewerName.trim()}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: !viewerName.trim() ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !viewerName.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Only show when name is set */}
      {isNameSet && (
        <>
          {/* User Info */}
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Welcome, {viewerName}! 👋
            </p>
            <button
              onClick={() => {
                setIsNameSet(false);
                setViewerName('');
                if (isViewing) {
                  stopViewing();
                }
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Change Name
            </button>
          </div>
      
          {/* Connection Status */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: isConnected ? '#e8f5e8' : '#ffe8e8', 
            borderRadius: '8px',
            border: `2px solid ${isConnected ? '#4CAF50' : '#f44336'}`
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Connection Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>

      {/* Available Streams */}
      {!isViewing && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2>📺 Available Live Streams</h2>
            <button 
              onClick={refreshStreams}
              disabled={!isConnected}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
          
          {availableStreams.length === 0 ? (
            <div style={{ 
              padding: '30px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px dashed #dee2e6'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '48px' }}>🎬</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                No live streams available
              </p>
              <p style={{ margin: 0, color: '#666' }}>
                Check back later or ask a broadcaster to start streaming!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {availableStreams.map((stream) => (
                <div 
                  key={stream.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#333',
                      fontSize: '18px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {stream.title}
                    </h3>
                    <p style={{ 
                      margin: '0 0 5px 0', 
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      👤 {stream.broadcasterName}
                    </p>
                    <p style={{ 
                      margin: '0 0 10px 0', 
                      color: '#666',
                      fontSize: '12px'
                    }}>
                      🕒 Started: {new Date(stream.startTime).toLocaleTimeString()}
                    </p>
                    <p style={{ 
                      margin: 0, 
                      color: '#28a745',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      👥 {stream.viewerCount} viewer{stream.viewerCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => joinStream(stream.id)}
                    disabled={!isConnected || isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: (!isConnected || isLoading) ? '#ccc' : '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: (!isConnected || isLoading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? '⏳ Loading...' : '👁️ Join Stream'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Stream Viewer */}
      {isViewing && currentStreamInfo && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '8px',
            border: '2px solid #4CAF50',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>
              🔴 Now Watching: {currentStreamInfo.title}
            </h3>
            <p style={{ margin: '0 0 5px 0' }}>
              👤 Broadcaster: {currentStreamInfo.broadcasterName}
            </p>
            <p style={{ margin: 0 }}>
              👥 Viewers: {currentStreamInfo.viewerCount}
            </p>
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <button 
              onClick={stopViewing}
              style={{ 
                padding: '15px 30px', 
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              ❌ Leave Stream
            </button>
          </div>
        </div>
      )}

      {/* Video Display */}
      {isViewing && currentStreamInfo ? (
        /* Two-column layout when viewing a stream */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '20px', 
          alignItems: 'start'
        }}>
          {/* Video Section */}
          <div style={{ textAlign: 'center' }}>
            <h2>📺 Live Stream</h2>
            <div style={{ 
              display: 'inline-block',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: '800px'
            }}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%', 
                  height: '450px', 
                  backgroundColor: '#000',
                  display: 'block'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                👁️ WATCHING
              </div>
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '18px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '20px',
                  borderRadius: '10px'
                }}>
                  <p style={{ margin: '10px 0', fontSize: '48px' }}>⏳</p>
                  <p style={{ margin: '10px 0' }}>Loading stream...</p>
                  {loadingStatus && (
                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.8 }}>
                      {loadingStatus}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      console.log('User cancelled loading');
                      setIsLoading(false);
                      setLoadingStatus('');
                      setSelectedStreamId(null);
                      setCurrentStreamInfo(null);
                    }}
                    style={{
                      marginTop: '15px',
                      padding: '8px 16px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div>
            <h2>💬 Live Chat</h2>
            {isConnected && viewerName && (
              <LiveStreamChat
                streamId={currentStreamInfo.id}
                username={viewerName}
                userId={`viewer_${Date.now()}`}
                isStreamer={false}
                socket={socketRef.current!}
              />
            )}
            {(!isConnected || !viewerName) && (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{ color: '#666' }}>
                  {!isConnected ? 'Connecting to chat...' : 'Set your name to join chat'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single column layout when not viewing */
        <div style={{ textAlign: 'center' }}>
          <h2>📺 {isViewing ? 'Live Stream' : 'Stream Player'}</h2>
          <div style={{ 
            display: 'inline-block',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              muted={false}
              controls
              style={{ 
                width: '800px', 
                height: '450px', 
                backgroundColor: '#000',
                display: 'block'
              }}
            />
            {!isViewing && !isLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                fontSize: '18px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '10px 0', fontSize: '48px' }}>📺</p>
                <p style={{ margin: 0 }}>
                  {availableStreams.length > 0 
                    ? 'Select a stream above to start watching' 
                    : 'No live streams available'}
                </p>
              </div>
            )}
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontSize: '18px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '10px 0', fontSize: '48px' }}>⏳</p>
                <p style={{ margin: 0 }}>Loading stream...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h3>📋 How to Watch</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li>Browse available live streams above</li>
          <li>Click "Join Stream" on any stream you want to watch</li>
          <li>Enjoy the live content in real-time!</li>
          <li>You can see how many other viewers are watching</li>
          <li>Click "Leave Stream" to stop watching and browse other streams</li>
        </ul>
      </div>

      {/* Navigation */}
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '8px'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>Want to start your own stream?</p>
        <a 
          href="/livestream-broadcaster" 
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          🎥 Go to Broadcaster Page
        </a>
      </div>
        </>
      )}
    </div>
  );
};

export default LivestreamViewer;
