"use client";
import React, { useRef, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { LiveStreamChat } from '@/components/livestream/LiveStreamChat';

const LivestreamBroadcaster: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [broadcasterName, setBroadcasterName] = useState('');
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);

  let device: Device;
  let producerTransport: any;
  let videoProducer: any;
  let audioProducer: any;

  // Socket event listeners
  useEffect(() => {
    console.log('Setting up broadcaster socket listeners...');
    
    // Initialize socket connection
    socketRef.current = io('http://localhost:4000');
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      console.log('Broadcaster socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Broadcaster socket disconnected');
      setIsConnected(false);
    });

    socket.on('streamViewerCount', ({ streamId: receivedStreamId, count }) => {
      if (receivedStreamId === streamId) {
        console.log('Viewer count updated:', count);
        setViewerCount(count);
      }
    });

    return () => {
      console.log('Cleaning up broadcaster socket listeners...');
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('streamViewerCount');
        if (isStreaming) {
          stopStreaming();
        }
        socket.disconnect();
      }
    };
  }, []);

  // Update viewer count when streamId changes
  useEffect(() => {
    if (socketRef.current && streamId) {
      const socket = socketRef.current;
      
      const handleViewerCount = ({ streamId: receivedStreamId, count }: { streamId: string, count: number }) => {
        if (receivedStreamId === streamId) {
          console.log('Viewer count updated:', count);
          setViewerCount(count);
        }
      };

      socket.on('streamViewerCount', handleViewerCount);
      
      return () => {
        socket.off('streamViewerCount', handleViewerCount);
      };
    }
  }, [streamId]);

  const createStream = async () => {
    try {
      if (!isConnected || !socketRef.current) {
        alert('Not connected to server. Please wait and try again.');
        return;
      }

      if (!streamTitle.trim() || !broadcasterName.trim()) {
        alert('Please enter both stream title and your name.');
        return;
      }

      setIsCreatingStream(true);

      socketRef.current.emit('createStream', { 
        title: streamTitle.trim(), 
        broadcasterName: broadcasterName.trim() 
      }, (response: any) => {
        setIsCreatingStream(false);
        if (response.error) {
          console.error('Error creating stream:', response.error);
          alert('Error creating stream: ' + response.error);
        } else {
          setStreamId(response.streamId);
          console.log('Stream created with ID:', response.streamId);
        }
      });
    } catch (error) {
      console.error('Error creating stream:', error);
      setIsCreatingStream(false);
    }
  };

  const startStreaming = async () => {
    try {
      if (!isConnected || !streamId || !socketRef.current) {
        alert('No stream created or not connected to server.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      
      // Check if the video element exists before setting srcObject
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      } else {
        console.error('Local video element not found');
        return;
      }
      
      setIsStreaming(true);
      console.log('Local video stream set up successfully');

      socketRef.current.emit('getRouterRtpCapabilities', async (rtpCapabilities: any) => {
        console.log('Received RTP capabilities:', rtpCapabilities);
        device = new Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        console.log('MediaSoup device loaded');

        socketRef.current!.emit('createProducerTransport', { streamId }, async (transportInfo: any) => {
          if (transportInfo.error) {
            console.error('Error creating producer transport:', transportInfo.error);
            setIsStreaming(false);
            return;
          }

          console.log('Received producer transport info:', transportInfo);
          producerTransport = device.createSendTransport(transportInfo);
          console.log('Producer transport created');

          producerTransport.on(
            'connect',
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
              console.log('Producer transport connecting...');
              socketRef.current!.emit(
                'connectProducerTransport',
                { streamId, dtlsParameters },
                (response: any) => {
                  if (response?.error) {
                    console.error('Error connecting producer transport:', response.error);
                    errback(response.error);
                  } else {
                    console.log('Producer transport connected');
                    callback();
                  }
                }
              );
            }
          );

          producerTransport.on(
            'produce',
            async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
              console.log('Producing', kind, 'track...');
              socketRef.current!.emit('produce', { streamId, kind, rtpParameters }, (response: any) => {
                if (response?.error) {
                  console.error('Error producing:', response.error);
                  errback(response.error);
                } else {
                  console.log('Producer created with ID:', response.id);
                  callback({ id: response.id });
                }
              });
            }
          );

          producerTransport.on('connectionstatechange', (state: string) => {
            console.log('Producer transport connection state:', state);
          });

          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          console.log('Video track:', videoTrack?.label, 'Audio track:', audioTrack?.label);

          try {
            videoProducer = await producerTransport.produce({ track: videoTrack });
            console.log('Video producer created:', videoProducer.id);
            
            audioProducer = await producerTransport.produce({ track: audioTrack });
            console.log('Audio producer created:', audioProducer.id);
            
            // Notify server that streaming started
            socketRef.current!.emit('startStream', { streamId });
            console.log('Start stream event emitted');
          } catch (error) {
            console.error('Error creating producers:', error);
            stopStreaming();
          }
        });
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      setIsStreaming(false);
      // Clean up on error
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
    }
  };

  const stopStreaming = () => {
    console.log('Stopping stream...');
    
    // Stop media tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      localVideoRef.current.srcObject = null;
    }

    // Close producers
    if (videoProducer) {
      videoProducer.close();
      videoProducer = null;
      console.log('Video producer closed');
    }
    if (audioProducer) {
      audioProducer.close();
      audioProducer = null;
      console.log('Audio producer closed');
    }

    // Close transport
    if (producerTransport) {
      producerTransport.close();
      producerTransport = null;
      console.log('Producer transport closed');
    }

    // Notify server
    if (streamId && socketRef.current) {
      socketRef.current.emit('stopStream', { streamId });
    }
    
    setIsStreaming(false);
    setViewerCount(0);
    setStreamId(null);
    setStreamTitle('');
    setBroadcasterName('');
    console.log('Stream stopped successfully');
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>🎥 Live Stream Broadcaster</h1>
      
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

      {/* Stream Setup Form */}
      {!streamId && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '2px solid #007bff'
        }}>
          <h3 style={{ marginTop: 0, color: '#007bff' }}>📝 Create Your Stream</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Stream Title:
            </label>
            <input 
              type="text"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Enter your stream title..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
              maxLength={100}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              Your Name:
            </label>
            <input 
              type="text"
              value={broadcasterName}
              onChange={(e) => setBroadcasterName(e.target.value)}
              placeholder="Enter your name..."
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
              maxLength={50}
            />
          </div>
          
          <button 
            onClick={createStream}
            disabled={!isConnected || isCreatingStream || !streamTitle.trim() || !broadcasterName.trim()}
            style={{ 
              padding: '12px 25px', 
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: (!isConnected || isCreatingStream || !streamTitle.trim() || !broadcasterName.trim()) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (!isConnected || isCreatingStream || !streamTitle.trim() || !broadcasterName.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {isCreatingStream ? '⏳ Creating...' : '🎬 Create Stream'}
          </button>
        </div>
      )}

      {/* Stream Info */}
      {streamId && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '8px',
          border: '2px solid #4CAF50'
        }}>
          <h3 style={{ marginTop: 0, color: '#4CAF50' }}>✅ Stream Created</h3>
          <p style={{ margin: '5px 0' }}><strong>Stream ID:</strong> {streamId}</p>
          <p style={{ margin: '5px 0' }}><strong>Title:</strong> {streamTitle}</p>
          <p style={{ margin: '5px 0' }}><strong>Broadcaster:</strong> {broadcasterName}</p>
        </div>
      )}

      {/* Stream Status */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '8px',
        border: '2px solid #008CBA'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
          <strong>Stream Status:</strong> {isStreaming ? '🔴 Live' : '⚫ Offline'}
        </p>
        {isStreaming && (
          <p style={{ margin: 0 }}>
            <strong>👥 Current Viewers:</strong> {viewerCount}
          </p>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        {!isStreaming ? (
          <button 
            onClick={startStreaming} 
            disabled={!isConnected || !streamId}
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: (!isConnected || !streamId) ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!isConnected || !streamId) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            🚀 Start Broadcasting
          </button>
        ) : (
          <button 
            onClick={stopStreaming}
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
            ⏹️ Stop Broadcasting
          </button>
        )}
        
        {streamId && !isStreaming && (
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => {
                setStreamId(null);
                setStreamTitle('');
                setBroadcasterName('');
              }}
              style={{ 
                padding: '10px 20px', 
                fontSize: '14px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🗑️ Delete Stream
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Video and Chat */}
      {streamId && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '20px', 
          marginTop: '20px',
          alignItems: 'start'
        }}>
          {/* Video Preview */}
          <div style={{ textAlign: 'center' }}>
            <h2>📹 Your Stream Preview</h2>
            <div style={{ 
              display: 'inline-block',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: '600px'
            }}>
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  backgroundColor: '#000',
                  display: 'block'
                }}
              />
              {isStreaming && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  🔴 LIVE
                </div>
              )}
              {!isStreaming && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#666',
                  fontSize: '18px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '10px 0', fontSize: '48px' }}>📹</p>
                  <p style={{ margin: 0 }}>Click "Start Broadcasting" to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div>
            <h2>💬 Live Chat</h2>
            {isConnected && broadcasterName && (
              <LiveStreamChat
                streamId={streamId}
                username={broadcasterName}
                userId={`broadcaster_${streamId}`}
                isStreamer={true}
                socket={socketRef.current!}
              />
            )}
            {(!isConnected || !broadcasterName) && (
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
                  {!isConnected ? 'Connecting to chat...' : 'Enter broadcaster name to enable chat'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Preview - When no stream created */}
      {!streamId && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h2>📹 Your Stream Preview</h2>
          <div style={{ 
            display: 'inline-block',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}>
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ 
                width: '600px', 
                height: '400px', 
                backgroundColor: '#000',
                display: 'block'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#666',
              fontSize: '18px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '10px 0', fontSize: '48px' }}>📹</p>
              <p style={{ margin: 0 }}>Create a stream to begin</p>
            </div>
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
        <h3>📋 Instructions</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li>Make sure your camera and microphone are connected</li>
          <li>Click "Start Broadcasting" to begin your live stream</li>
          <li>Share the viewer page URL with your audience</li>
          <li>Monitor viewer count in real-time</li>
          <li>Click "Stop Broadcasting" when you're done</li>
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
        <p style={{ margin: '0 0 10px 0' }}>Want to watch a stream instead?</p>
        <a 
          href="/livestream-viewer" 
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#ff9800',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          👁️ Go to Viewer Page
        </a>
      </div>
    </div>
  );
};

export default LivestreamBroadcaster;
