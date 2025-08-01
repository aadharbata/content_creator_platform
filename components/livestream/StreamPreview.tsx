"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, Maximize2, RotateCcw, Camera, CameraOff } from "lucide-react"

export function StreamPreview() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        }, 
        audio: true 
      })
      
      console.log('Camera stream obtained:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      
      // Store the stream first
      streamRef.current = stream
      setIsCameraOn(true)
      
      // Wait a bit for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source after timeout...')
          videoRef.current.srcObject = stream
          
          // Try to play the video
          videoRef.current.play()
            .then(() => {
              console.log('Video is playing successfully')
            })
            .catch((playError) => {
              console.error('Error playing video:', playError)
              // Video might play automatically, so this error might not be critical
            })
        } else {
          console.error('Video ref is still null after timeout')
          setError('Video element not ready')
        }
      }, 100)
      
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Failed to access camera. Please check permissions.')
      setIsCameraOn(false)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
  }

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Handle video stream assignment when camera state changes
  useEffect(() => {
    if (isCameraOn && streamRef.current && videoRef.current) {
      console.log('Assigning stream to video element via useEffect')
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(console.error)
    }
  }, [isCameraOn])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Stream Preview
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={toggleCamera}
              variant={isCameraOn ? "destructive" : "default"}
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isCameraOn ? (
                <CameraOff className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {isLoading ? 'Starting...' : isCameraOn ? 'Stop' : 'Start'}
            </Button>
            <Badge variant={isCameraOn ? "destructive" : "secondary"} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
              {isCameraOn ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video group">
          {/* Camera Video or Placeholder */}
          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Monitor className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">
                  {error ? 'Camera Error' : 'Your Stream Preview'}
                </p>
                <p className="text-xs opacity-75">
                  {error ? error : 'Click Start to begin streaming'}
                </p>
              </div>
            </div>
          )}

          {/* Preview Controls */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8 p-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stream Info Overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-white text-xs">
              <div className="flex justify-between items-center">
                <span>High Quality Stream</span>
                <span>Status: {isCameraOn ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className={`text-lg font-bold ${isCameraOn ? 'text-green-500' : 'text-gray-400'}`}>
              {isCameraOn ? 'Stable' : 'Offline'}
            </div>
            <div className="text-xs text-muted-foreground">Connection</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {isCameraOn ? 'Good' : '--'}
            </div>
            <div className="text-xs text-muted-foreground">Quality</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {isCameraOn ? 'Smooth' : '--'}
            </div>
            <div className="text-xs text-muted-foreground">Performance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 