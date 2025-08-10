'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Monitor, Maximize2, RotateCcw } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

// Use environment variable or fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_LIVESTREAM_SERVER_URL || "http://localhost:4000";

interface StreamPreviewProps {
  onViewerCountChange?: (count: number) => void;
}

export default function StreamPreview({ onViewerCountChange }: StreamPreviewProps) {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [quality, setQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [performance, setPerformance] = useState<'ready' | 'loading' | 'error'>('ready');
  const [viewerCount, setViewerCount] = useState(0);
  
  // Mediasoup states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<any>(null);
  const [producerTransport, setProducerTransport] = useState<any>(null);
  const [producers, setProducers] = useState<Map<string, any>>(new Map());
  const [streamId, setStreamId] = useState<string | null>(null);

  const isCreator = (session?.user as any)?.role === 'CREATOR';

  useEffect(() => {
    if (!isCreator) return;

    console.log('Initializing socket connection to:', SOCKET_URL);
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to livestream server');
      setConnectionStatus('connected');
      setError('');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from livestream server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to streaming server');
      setConnectionStatus('disconnected');
    });

    // Initialize mediasoup device
    newSocket.on('routerRtpCapabilities', async (rtpCapabilities: any) => {
      console.log('Received router RTP capabilities:', rtpCapabilities);
      try {
        // Import mediasoup-client dynamically
        const mediasoupClient = await import('mediasoup-client');
        const newDevice = new mediasoupClient.Device();
        await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
        setDevice(newDevice);
        console.log('Mediasoup device loaded successfully');
      } catch (error) {
        console.error('Failed to load device:', error);
        setError('Failed to initialize streaming device');
      }
    });

    newSocket.on('streamStarted', (data: any) => {
      console.log('Stream started:', data);
      setIsStreaming(true);
    });

    newSocket.on('streamEnded', (data: any) => {
      console.log('Stream ended:', data);
      setIsStreaming(false);
      setStreamId(null);
    });

    newSocket.on('streamStartError', (data: any) => {
      console.error('Stream start error:', data);
      setError(data.error || 'Failed to start stream');
      setIsStreaming(false);
    });

    newSocket.on('viewerCount', (count: number) => {
      console.log('Viewer count updated:', count);
      setViewerCount(count);
      onViewerCountChange?.(count);
    });

    // Request router capabilities
    newSocket.emit('getRouterRtpCapabilities');

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [isCreator, onViewerCountChange]);

  const startCamera = async () => {
    if (!videoRef.current) {
      console.error('Video element not available');
      setError('Video element not available');
      return;
    }

    try {
      console.log('Requesting camera access...');
      setError('');
      setPerformance('loading');

      // Request camera with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Camera access granted, stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks().map(t => `${t.kind} - ${t.label} - ${t.readyState}`));
      console.log('Audio tracks:', stream.getAudioTracks().map(t => `${t.kind} - ${t.label} - ${t.readyState}`));

      // Set the stream to video element
      videoRef.current.srcObject = stream;
      
      // Add event listeners for debugging
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight,
          duration: videoRef.current?.duration
        });
      };

      videoRef.current.onplay = () => {
        console.log('Video started playing');
        setIsCameraOn(true);
        setPerformance('ready');
      };

      videoRef.current.onerror = (e) => {
        console.error('Video element error:', e);
        setError('Failed to display camera feed');
        setPerformance('error');
      };

      // Attempt to play the video
      try {
        await videoRef.current.play();
        console.log('Video play() succeeded');
      } catch (playError) {
        console.error('Video play() failed:', playError);
        // Try to play without user interaction requirement
        videoRef.current.muted = true;
        await videoRef.current.play();
        console.log('Video play() succeeded after muting');
      }

      // Start streaming if device is ready
      if (device && socket) {
        await startStreaming(stream);
      }

    } catch (error: any) {
      console.error('Camera access error:', error);
      setPerformance('error');
      
      if (error.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Failed to access camera: ${error.message}`);
      }
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
    setPerformance('ready');

    // Stop streaming
    if (isStreaming && socket && streamId) {
      console.log('Stopping stream:', streamId);
      socket.emit('stopStream', { streamId });
    }
  };

  const startStreaming = async (stream: MediaStream) => {
    if (!socket || !device || !isCreator) return;

    try {
      console.log('Starting streaming process...')
      
      // Create stream on server
      socket.emit('createStream', {
        title: `${(session?.user as any)?.name || 'Creator'}'s Live Stream`,
        broadcasterName: (session?.user as any)?.name || 'Creator'
      }, async (result: any) => {
        if (result.error) {
          console.error('Error creating stream:', result.error);
          setError('Failed to create stream');
          return;
        }

        const newStreamId = result.streamId;
        console.log('Stream created with ID:', newStreamId);
        setStreamId(newStreamId);

        // Start the stream
        socket.emit('startStream', { streamId: newStreamId });

        // Create producer transport - FIXED: Pass streamId
        socket.emit('createProducerTransport', { streamId: newStreamId }, (params: any) => {
          if (params.error) {
            console.error('Error creating producer transport:', params.error);
            setError('Failed to create streaming connection');
            return;
          }

          console.log('Producer transport params received:', params);
          const transport = device.createSendTransport(params);
          setProducerTransport(transport);

          transport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
            console.log('Connecting producer transport...');
            // FIXED: Pass streamId
            socket.emit('connectProducerTransport', { streamId: newStreamId, dtlsParameters }, (result: any) => {
              if (result && result.error) {
                console.error('Error connecting producer transport:', result.error);
                errback(result.error);
              } else {
                console.log('Producer transport connected');
                callback();
              }
            });
          });

          transport.on('produce', ({ kind, rtpParameters }: any, callback: any, errback: any) => {
            console.log(`Producing ${kind} track...`);
            // FIXED: Pass streamId
            socket.emit('produce', { streamId: newStreamId, kind, rtpParameters }, (result: any) => {
              if (result.error) {
                console.error(`Error producing ${kind}:`, result.error);
                errback(result.error);
              } else {
                console.log(`Producer created for ${kind}:`, result.id);
                callback({ id: result.id });
              }
            });
          });

          // Produce video and audio tracks
          const tracks = stream.getTracks();
          console.log('Starting to produce tracks:', tracks.map(t => `${t.kind} - ${t.label}`));
          
          tracks.forEach(async (track) => {
            try {
              console.log(`Creating producer for ${track.kind} track:`, track.label);
              const producer = await transport.produce({ track });
              setProducers(prev => new Map(prev).set(producer.id, producer));
              console.log(`Producer created successfully for ${track.kind}:`, producer.id);
            } catch (error) {
              console.error(`Error creating producer for ${track.kind}:`, error);
              setError(`Failed to stream ${track.kind}`);
            }
          });
        });
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      setError('Failed to start streaming');
    }
  };

  const stopStreaming = () => {
    if (socket && streamId) {
      console.log('Stopping stream:', streamId);
      socket.emit('stopStream', { streamId });
      setIsStreaming(false);
      setStreamId(null);
    }

    // Close all producers
    producers.forEach((producer, id) => {
      console.log(`Closing producer: ${id}`);
      producer.close();
    });
    setProducers(new Map());

    // Close producer transport
    if (producerTransport) {
      console.log('Closing producer transport');
      producerTransport.close();
      setProducerTransport(null);
    }
  };

  if (!isCreator) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Creator access required</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stream Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ 
            display: 'block',
            backgroundColor: '#000',
            minHeight: '300px'
          }}
        />
        
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Camera Preview</p>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        <div className="absolute top-4 left-4">
          <Badge variant={isStreaming ? "destructive" : "secondary"}>
            {isStreaming ? "🔴 LIVE" : "⚫ OFFLINE"}
          </Badge>
        </div>

        {/* Viewer Count */}
        {isStreaming && (
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-black/50 text-white border-white/20">
              👁 {viewerCount} viewers
            </Badge>
          </div>
        )}

        {/* Stream Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {!isCameraOn ? (
            <Button
              onClick={startCamera}
              disabled={connectionStatus !== 'connected'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              variant="destructive"
            >
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
          )}

          {isCameraOn && !isStreaming && (
            <Button
              onClick={() => startStreaming(videoRef.current?.srcObject as MediaStream)}
              disabled={!device || connectionStatus !== 'connected'}
              className="bg-red-600 hover:bg-red-700"
            >
              Go Live
            </Button>
          )}

          {isStreaming && (
            <Button
              onClick={stopStreaming}
              variant="outline"
            >
              Stop Stream
            </Button>
          )}
        </div>

        {/* Quality Indicator */}
        <div className="absolute bottom-4 right-4">
          <Badge variant="outline" className="bg-black/50 text-white border-white/20">
            <Monitor className="w-3 h-3 mr-1" />
            High Quality Stream
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          <Button
            onClick={() => setError('')}
            variant="ghost"
            size="sm"
            className="mt-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Try Again
          </Button>
        </div>
      )}

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{connectionStatus}</p>
          <p className="text-xs font-medium">Connection</p>
        </div>
        
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            quality === 'good' ? 'bg-green-500' : 
            quality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{quality}</p>
          <p className="text-xs font-medium">Quality</p>
        </div>
        
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            performance === 'ready' ? 'bg-green-500' : 
            performance === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{performance}</p>
          <p className="text-xs font-medium">Performance</p>
        </div>
      </div>
    </div>
  );
} 