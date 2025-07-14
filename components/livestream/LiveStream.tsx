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

// const SOCKET_URL = "http://10.145.137.71:4000/stream";
// const SOCKET_URL = "http://localhost:4000/stream";
const SOCKET_URL = "http://10.145.170.231:4000/stream";

interface LiveStreamProps {
  role: "creator" | "audience";
  roomId: string;
  creatorName?: string;
  audienceName?: string;
}

export default function LiveStream({ role, roomId, creatorName, audienceName }: LiveStreamProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<{ user: string; text: string }[]>([]);
  const [tips, setTips] = useState<{ user: string; amount: number; message: string }[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const audiencePC = useRef<RTCPeerConnection | null>(null);
  const remoteMediaStream = useRef<MediaStream | null>(null);
  const [stopLiveLoading, setStopLiveLoading] = useState(false);
  const router = useRouter();

  // Setup socket connection and join room
  useEffect(() => {
    if (!role) return;
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit("join", { roomId, role });
    return () => {
      s.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      if (audiencePC.current) audiencePC.current.close();
      audiencePC.current = null;
      remoteMediaStream.current = null;
    };
  }, [role, roomId]);

  // Add reconnection and session refresh logic
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // 1. Refresh NextAuth session to prevent 401
        try {
          await getSession();
        } catch {
          // Optionally, handle session refresh error
        }
        // 2. Reconnect socket if disconnected
        if (!socket || (socket && !socket.connected)) {
          const s = io(SOCKET_URL);
          setSocket(s);
          s.emit("join", { roomId, role });
        }
        // 3. Re-initialize camera/WebRTC if needed (creator only)
        if (role === "creator" && (!localStreamRef.current || !localVideoRef.current?.srcObject)) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          } catch {
            // Optionally, handle camera re-init error
          }
        }
        // 4. For audience, re-request stream if needed
        if (role === "audience" && (!remoteStream || !remoteVideoRef.current?.srcObject)) {
          setRemoteStream(null);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [role, roomId, socket]);

  // Creator: getUserMedia and handle signaling
  useEffect(() => {
    if (role !== "creator" || !socket) return;
    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      stream = s;
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });
    socket.on("audience-joined", async ({ audienceId }) => {
      if (!localStreamRef.current) return;
      const pc = createPeerConnection(audienceId, socket);
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { to: audienceId, offer });
      }, 100);
    });
    socket.on("answer", async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("candidate", ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on("stream-ended", () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    });
    socket.on("like", () => setLikes((l) => l + 1));
    socket.on("comment", (data) => setComments((c) => [...c, data]));
    socket.on("tip", (data) => setTips((t) => [...t, data]));
  }, [role, socket]);

  // Audience: handle signaling and receive stream
  useEffect(() => {
    if (role !== "audience" || !socket) return;
    remoteMediaStream.current = new window.MediaStream();
    setRemoteStream(remoteMediaStream.current);
    socket.on("offer", async ({ from, offer }) => {
      if (audiencePC.current) audiencePC.current.close();
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      audiencePC.current = pc;
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          if (!remoteMediaStream.current!.getTracks().find(t => t.id === track.id)) {
            remoteMediaStream.current!.addTrack(track);
          }
        });
        setRemoteStream(remoteMediaStream.current!);
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", { to: from, candidate: event.candidate });
        }
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    });
    socket.on("candidate", ({ candidate }) => {
      if (audiencePC.current && candidate) audiencePC.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on("stream-ended", () => {
      setRemoteStream(null);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (audiencePC.current) audiencePC.current.close();
      audiencePC.current = null;
      remoteMediaStream.current = null;
    });
    socket.on("like", () => setLikes((l) => l + 1));
    socket.on("comment", (data) => setComments((c) => [...c, data]));
    socket.on("tip", (data) => setTips((t) => [...t, data]));
  }, [role, socket]);

  // Ensure video element updates when remoteStream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Camera loss detection for creators
  useEffect(() => {
    if (role !== "creator" || !localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleEnded = () => {
      alert("Camera access lost. Please close other tabs or re-enable camera.");
      // Optionally, try to re-acquire the camera here
    };

    videoTrack.addEventListener("ended", handleEnded);
    videoTrack.addEventListener("inactive", handleEnded);

    return () => {
      videoTrack.removeEventListener("ended", handleEnded);
      videoTrack.removeEventListener("inactive", handleEnded);
    };
  }, [role, localStreamRef.current]);

  // Peer connection factory
  function createPeerConnection(peerId: string, socket: Socket) {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnections.current[peerId] = pc;
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", { to: peerId, candidate: event.candidate });
      }
    };
    return pc;
  }

  // Audience: send like
  const handleLike = () => {
    if (socket) socket.emit("like", { roomId });
  };
  // Audience: send comment
  const handleComment = () => {
    if (socket && commentInput.trim()) {
      socket.emit("comment", { roomId, data: { user: audienceName || "Audience", text: commentInput } });
      setCommentInput("");
    }
  };
  // Audience: send tip
  const handleTip = () => {
    if (socket && tipAmount) {
      socket.emit("tip", { roomId, data: { user: audienceName || "Audience", amount: Number(tipAmount), message: tipMessage } });
      setTipAmount("");
      setTipMessage("");
    }
  };

  const handleStopLive = async () => {
    setStopLiveLoading(true);
    try {
      await axios.delete(`/api/creator/${roomId}/golive`);
      // Stop camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
      }
      alert("You have stopped livestreaming.");
      // Redirect to dashboard
      router.push(`/creator/${roomId}/dashboard`);
    } catch {
      alert("Failed to stop live. Please try again.");
    } finally {
      setStopLiveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col items-center justify-center py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/90">
        <CardContent className="p-8 flex flex-col md:flex-row gap-8">
          {/* Creator Video/Info */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12 ring-2 ring-red-500">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || "Creator")}`} />
                <AvatarFallback>{(creatorName || "C")[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-lg text-gray-100">{creatorName || "Creator"}</div>
                <Badge className="bg-red-600 text-white ml-2">LIVE</Badge>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg mb-4">
              {role === "creator" ? (
                <>
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-96 h-56 bg-black rounded-xl" />
                  <Button
                    onClick={handleStopLive}
                    disabled={stopLiveLoading}
                    className="mt-4 bg-gradient-to-r from-gray-500 to-gray-800 text-white font-bold shadow-lg px-8 py-2 text-lg rounded-xl"
                  >
                    {stopLiveLoading ? "Stopping..." : "Stop Live"}
                  </Button>
                </>
              ) : (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-96 h-56 bg-black rounded-xl" />
              )}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-gray-300">Likes: <span className="font-bold text-yellow-400">{likes}</span></div>
              <div className="text-gray-300">Tips: <span className="font-bold text-green-400">{tips.length}</span></div>
            </div>
            {role === "audience" && (
              <Button onClick={handleLike} size="sm" className="mt-4 bg-yellow-500 text-black">👍 Like</Button>
            )}
          </div>
          {/* Audience/Chat/Tip */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-gray-900/80 rounded-xl p-4 mb-2">
              <div className="font-semibold text-gray-200 mb-2">Live Chat</div>
              <div className="h-32 overflow-y-auto bg-gray-800 rounded p-2 mb-2">
                {comments.map((c, i) => (
                  <div key={i} className="text-sm text-gray-100">
                    <span className="font-bold text-yellow-300">{c.user}:</span> {c.text}
                  </div>
                ))}
              </div>
              {role === "audience" && (
                <div className="flex gap-2">
                  <input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="Type a comment..."
                    className="flex-1 px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none"
                  />
                  <Button onClick={handleComment} size="sm" className="bg-yellow-500 text-black">Send</Button>
                </div>
              )}
            </div>
            <div className="bg-gray-900/80 rounded-xl p-4">
              <div className="font-semibold text-gray-200 mb-2">Send a Tip</div>
              {role === "audience" && (
                <div className="flex gap-2">
                  <input
                    value={tipAmount}
                    onChange={e => setTipAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-24 px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none"
                  />
                  <input
                    value={tipMessage}
                    onChange={e => setTipMessage(e.target.value)}
                    placeholder="Message (optional)"
                    className="flex-1 px-3 py-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none"
                  />
                  <Button onClick={handleTip} size="sm" className="bg-green-500 text-black">Tip</Button>
                </div>
              )}
              <div className="mt-2 h-16 overflow-y-auto">
                {tips.map((t, i) => (
                  <div key={i} className="text-sm text-green-300">
                    <span className="font-bold">{t.user}:</span> ${t.amount} - {t.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 