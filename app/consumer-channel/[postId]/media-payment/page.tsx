"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Media = {
  id: string;
  creator: {
    name: string;
    handle: string;
    avatar: string;
  };
  time: string;
  content: string;
  image: string;
  isPaid: boolean;
  price?: string;
  likes: number;
  comments?: number;
  isLiked: boolean;
};

function isAxiosError(error: unknown): error is { response: { data: { error: string } } } {
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response && typeof response === 'object' ? (response as { data?: unknown }).data : undefined;
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in (error as object) &&
    typeof response === "object" &&
    response !== null &&
    typeof data === "object" &&
    data !== null &&
    "error" in (data as object)
  );
}

export default function MediaPaymentPage({params}: {params: {postId: string}}) {
  const { postId } = params;
  const router = useRouter();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    const SearchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/posts/${postId}/search`, {
          headers: {
            "Authorization": `Bearer${token}`
          }
        });
        if (res.data && res.data.success && res.data.media) {
          setMedia(res.data.media as Media);
        } else {
          setError("Media not found");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError("Error in searching post: " + (error.response?.data?.message || error.message));
        } else if (error instanceof Error) {
          setError("Error in searching post: " + error.message);
        } else {
          setError("Error in searching post: Unknown error");
        }
      }
      setLoading(false);
    };
    if (token) {
      SearchPost();
    }
  }, [postId, token]);

  // Check if already unlocked on mount
  useEffect(() => {
    const checkUnlock = async () => {
      if (!token) return;
      try {
        const res = await axios.post("/api/payment/check-unlock-media", { postId }, {
          headers: { Authorization: `Bearer${token}` }
        });
        if (res.data.success && res.data.unlocked) {
          setUnlocked(true);
        }
      } catch {}
    };
    checkUnlock();
  }, [postId, token]);

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/payment/unlock-media", { postId }, {
        headers: { Authorization: `Bearer${token}` }
      });
      if (res.data.success && res.data.unlocked) {
        setUnlocked(true);
        // Set flag to refresh feed
        if (typeof window !== "undefined") {
          localStorage.setItem('refreshFeed', 'true');
        }
        // Redirect to consumer-channel feed after unlock
        setTimeout(() => {
          router.push("/consumer-channel");
        }, 1000);
      } else {
        setError(res.data.error || "Failed to unlock media");
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        console.error("Unlock error:", err, err.response.data);
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to unlock media");
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-gray-300 py-12">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
  if (!media) return <div className="text-center text-gray-300 py-12">No media found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center py-12">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/90">
        <CardContent className="p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-16 h-16 ring-2 ring-yellow-400">
              <AvatarImage src={media.creator.avatar} />
              <AvatarFallback>{media.creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-lg font-bold text-gray-100">{media.creator.name}</div>
          </div>
          <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black flex items-center justify-center">
            {unlocked
              ? <Image src={media.image} alt={media.content || "media"} width={400} height={225} className="object-cover w-full h-full" />
              : <span role="img" aria-label="locked" className="text-7xl text-gray-400">🔒</span>
            }
          </div>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Unlock Media</h2>
            <p className="text-gray-300 mb-4">Pay to access this exclusive media file.</p>
            <div className="text-3xl font-extrabold text-green-400 mb-4">{media.price || "Free"}</div>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-8 py-3 text-lg rounded-xl shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all" onClick={handleUnlock} disabled={unlocked || loading}>
              {unlocked ? "Unlocked" : loading ? "Processing..." : "Pay & Unlock"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 