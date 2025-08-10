"use client";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import LiveStream from "@/components/livestream/LiveStream";
import StreamPreview from "@/components/livestream/StreamPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Settings, Camera, CameraOff } from "lucide-react";

// Use environment variable or fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_LIVESTREAM_SERVER_URL || "http://localhost:4000";

export default function LivestreamPage() {
  const { data: session } = useSession();
  const params = useParams();
  const creatorId = params.creatorId as string;
  const isCreator = (session?.user as any)?.id === creatorId;
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(1234);

  // Creator-specific states for tips
  const [creatorSocket, setCreatorSocket] = useState<Socket | null>(null);
  const [creatorTips, setCreatorTips] = useState<{ user: string; amount: number; message: string }[]>([]);

  // Audience-specific states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<{ user: string; text: string }[]>([
    { user: "Viewer706", text: "This game looks fun" },
    { user: "Viewer853", text: "Amazing gameplay!" },
    { user: "Viewer922", text: "This game looks fun" },
    { user: "Viewer121", text: "This is so cool!" },
    { user: "Viewer366", text: "GG!" }
  ]);
  const [tips, setTips] = useState<{ user: string; amount: number; message: string }[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audiencePC = useRef<RTCPeerConnection | null>(null);

  // Setup socket connection for creator
  useEffect(() => {
    if (isCreator && session?.user) {
      const s = io(SOCKET_URL);
      setCreatorSocket(s);
      s.emit("join", { roomId: creatorId, role: "creator" });

      // Socket event listeners for creator
      s.on("tip", (data) => {
        setCreatorTips(prev => [...prev, data]);
      });

      return () => {
        s.disconnect();
      };
    }
  }, [isCreator, creatorId, session]);

  // Setup socket connection for audience
  useEffect(() => {
    if (!isCreator && session?.user) {
      const s = io(SOCKET_URL);
      setSocket(s);
      s.emit("join", { roomId: creatorId, role: "audience" });

      // Socket event listeners
      s.on("like", (data) => {
        // Update likes from server if needed, but we're managing locally for immediate feedback
        if (data.likes !== undefined) {
          setLikes(data.likes);
        }
      });
      s.on("comment", (data) => {
        setComments(prev => [...prev, data]);
      });
      s.on("tip", (data) => {
        setTips(prev => [...prev, data]);
      });

      return () => {
        s.disconnect();
        if (audiencePC.current) {
          audiencePC.current.close();
          audiencePC.current = null;
        }
      };
    }
  }, [isCreator, creatorId, session]);

  // Audience interaction handlers
  const handleLike = () => {
    if (socket) {
      if (isLiked) {
        // Unlike: decrement likes and set isLiked to false
        socket.emit("like", { roomId: creatorId, action: "unlike" });
        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like: increment likes and set isLiked to true
        socket.emit("like", { roomId: creatorId, action: "like" });
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    }
  };

  const handleComment = () => {
    if (socket && commentInput.trim()) {
      const newComment = { user: session?.user?.name || "Viewer", text: commentInput };
      socket.emit("comment", { roomId: creatorId, data: newComment });
      setComments(prev => [...prev, newComment]);
      setCommentInput("");
    }
  };

  const handleTip = (amount: number, message: string = "") => {
    if (socket) {
      const newTip = { user: session?.user?.name || "Viewer", amount, message };
      socket.emit("tip", { roomId: creatorId, data: newTip });
      setTips(prev => [...prev, newTip]);
      setTipAmount("");
      setTipMessage("");
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(tipAmount);
    if (amount > 0) {
      handleTip(amount, tipMessage);
    }
  };

  if (isCreator) {
    // Creator Dashboard View
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Stream Dashboard</h1>
              <p className="text-gray-600">Manage your live stream and interact with your audience</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isLive ? "destructive" : "secondary"} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Badge>
              <Button
                onClick={() => setIsLive(!isLive)}
                variant={isLive ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isLive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {isLive ? 'Stop Stream' : 'Go Live'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stream Preview - Left Column */}
            <div className="lg:col-span-2">
              <StreamPreview />
              
              {/* Stream Controls */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Stream Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{viewerCount}</div>
                      <div className="text-sm text-gray-600">Viewers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">HD</div>
                      <div className="text-sm text-gray-600">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">Smooth</div>
                      <div className="text-sm text-gray-600">Performance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">Excellent</div>
                      <div className="text-sm text-gray-600">Connection</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat & Analytics - Right Column */}
            <div className="space-y-6">
              {/* Live Chat */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-y-auto">
                    <div className="text-center text-gray-500 text-sm">
                      Chat messages will appear here when you go live
                    </div>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Send a message to your audience..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips Section - New */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 Tips Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-gray-50 rounded-lg p-4 overflow-y-auto">
                    {creatorTips.length > 0 ? (
                      <div className="space-y-3">
                        {creatorTips.slice().reverse().map((tip, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {tip.user[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{tip.user}</div>
                                  {tip.message && (
                                    <div className="text-sm text-gray-600">"{tip.message}"</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-lg font-bold text-green-600">${tip.amount}</div>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        Tips from your audience will appear here
                      </div>
                    )}
                  </div>
                  
                  {/* Tips Summary */}
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Total Tips Today</span>
                      <span className="text-lg font-bold text-green-600">
                        ${creatorTips.reduce((sum, tip) => sum + tip.amount, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-green-600">Number of tips</span>
                      <span className="text-sm font-medium text-green-600">{creatorTips.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Viewers</span>
                      <span className="text-lg font-bold text-blue-600">{viewerCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Peak Viewers</span>
                      <span className="text-lg font-bold text-green-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Views</span>
                      <span className="text-lg font-bold text-purple-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Stream Duration</span>
                      <span className="text-lg font-bold text-orange-600">00:00:00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Audience View - New Polished Interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Player - Left Side (2/3 width) */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg overflow-hidden aspect-video">
              {/* Actual Video Stream */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
                style={{ display: remoteStream ? 'block' : 'none' }}
              />
              
              {/* Placeholder when no stream */}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <div className="w-0 h-0 border-l-6 border-r-0 border-t-4 border-b-4 border-l-white border-t-transparent border-b-transparent ml-1"></div>
                    </div>
                    <p className="text-lg font-medium">Live Stream</p>
                    <p className="text-sm opacity-75">Connecting to stream...</p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-600 text-white text-sm px-3 py-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                  LIVE
                </Badge>
              </div>
              
              <div className="absolute top-4 right-4">
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                  {viewerCount.toLocaleString()} watching
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="mt-4 bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Gaming Session</h2>
              <p className="text-gray-600 mb-4">Join me for an epic gaming adventure! Playing the latest releases and taking on challenges.</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">LIVE</span>
                </div>
                <div>{viewerCount.toLocaleString()} viewers</div>
                <div>Started 2 hours ago</div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleLike} 
                  variant={isLiked ? "default" : "outline"}
                  size="sm" 
                  className={`${
                    isLiked 
                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                      : "text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ❤️ React ({likes})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  👥 Follow
                </Button>
              </div>
            </div>
          </div>

          {/* Chat & Tips Sidebar - Right Side (1/3 width) */}
          <div className="space-y-4">
            {/* Live Chat */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg flex items-center justify-between">
                  Live Chat
                  <span className="text-sm font-normal text-gray-500">{comments.length} messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Chat Messages */}
                <div className="h-64 overflow-y-auto space-y-3 mb-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {comment.user[0]?.toUpperCase() || 'V'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{comment.user}</span>
                          <span className="text-gray-400 text-xs">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <Button 
                    onClick={handleComment}
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support the Stream */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  🎁 Support the Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Quick Tips */}
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-3">Quick Tips</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button 
                      onClick={() => handleTip(1)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $1
                    </Button>
                    <Button 
                      onClick={() => handleTip(5)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $5
                    </Button>
                    <Button 
                      onClick={() => handleTip(10)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $10
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button 
                      onClick={() => handleTip(25)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $25
                    </Button>
                    <Button 
                      onClick={() => handleTip(50)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $50 ⭐
                    </Button>
                    <Button 
                      onClick={() => handleTip(100)}
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 border-gray-200 hover:bg-gray-50"
                    >
                      $100 ⭐
                    </Button>
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-2">Custom Amount</p>
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="$ 0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white mb-2"
                  />
                  <input
                    type="text"
                    value={tipMessage}
                    onChange={(e) => setTipMessage(e.target.value)}
                    placeholder="Message (optional)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* Tip Actions */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleCustomTip}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                    disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                  >
                    Tip ${tipAmount || '0.00'}
                  </Button>
                </div>

                {/* Recent Tips Display */}
                {tips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-600 text-sm mb-2">Recent Tips</p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {tips.slice(-3).map((tip, index) => (
                        <div key={index} className="text-xs text-green-600">
                          <span className="font-medium">{tip.user}</span> tipped ${tip.amount}
                          {tip.message && <span className="text-gray-500"> - {tip.message}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 