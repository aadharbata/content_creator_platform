"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Settings as SettingsIcon, 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share, 
  Settings, 
  Lock, 
  Moon, 
  Sun, 
  DollarSign, 
  Bookmark,
  Globe
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscriberCount: number;
  postCount: number;
  subscribed: boolean;
}

interface Post {
  id: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  time: string;
  content: string;
  image?: string;
  isPaid?: boolean;
  price?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isUnlocked?: boolean;
}

export default function ConsumerChannelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { translations: t, setLanguage, language } = useLanguage();
  const user = session?.user as SessionUser;

  // Helper function to translate content
  const translateContent = (content: string, type: 'name' | 'post') => {
    if (type === 'name') {
      return (t.creatorNames as any)?.[content] || content;
    } else if (type === 'post') {
      return (t.postContent as any)?.[content] || content;
    }
    return content;
  };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [post, setPost] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [visibleComments, setVisibleComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentCount, setCommentCount] = useState<{ [key: string]: number }>({});
  const [submittingComments, setSubmittingComments] = useState<Set<string>>(new Set());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [liveCreators, setLiveCreators] = useState<Creator[]>([]);
  const [loadingLiveCreators, setLoadingLiveCreators] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [creatorSearchTerm, setCreatorSearchTerm] = useState("");

  const sidebarLinks = [
    { id: "feed", label: t?.feed || "Feed", href: "#", icon: <Home className="w-6 h-6" /> },
    { id: "creators", label: t?.creators || "Creators", href: "#", icon: <Users className="w-6 h-6" /> },
    { id: "product-store", label: t?.productStore || "Product Store", href: "#", icon: <ShoppingBag className="w-6 h-6" /> },
    { id: "my-products", label: t?.myProducts || "My Products", href: "#", icon: <Settings className="w-6 h-6" /> },
    { id: "subscriptions", label: t?.subscriptions || "Subscriptions", href: "#", icon: <CreditCard className="w-6 h-6" /> },
    { id: "live-creators", label: t?.liveCreators || "Live Creators", href: "#", icon: <Users className="w-6 h-6" /> },
    { id: "chats", label: t?.chats || "Chats", href: "#", icon: <MessageCircle className="w-6 h-6" /> },
    { id: "settings", label: t?.settings || "Settings", href: "#", icon: <SettingsIcon className="w-6 h-6" /> },
  ];

  const filteredCreators = creators
    .filter(creator =>
      creator.name.toLowerCase().includes(creatorSearchTerm.toLowerCase()) ||
      creator.handle.toLowerCase().includes(creatorSearchTerm.toLowerCase())
    )
    .slice(0, 4);

  const fetchAndSetPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await axios.get(`/api/posts?lang=${language}`);
      if (response.data.success) {
        setPost(response.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      setInitialLoading(true);
      Promise.all([
        fetchAndSetPosts(),
        fetchTopCreators(),
        fetchLiveCreators(),
        fetchSubscriptions()
      ]).finally(() => {
        setInitialLoading(false);
      });
    }
  }, [status, language]);

  useEffect(() => {
    if (status === "authenticated" && !initialLoading) {
      fetchAndSetPosts();
    }
  }, [language]);

  useEffect(() => {
    if (post.length > 0) {
      post.forEach(p => {
        if (p.comments > 0 && !comments[p.id]) {
          fetchComments(p.id);
        }
      });
    }
  }, [post, comments]);

  const fetchTopCreators = async () => {
    try {
      setLoadingCreators(true);
      const response = await axios.get("/api/creators");
      if (response.data.success) {
        setCreators(response.data.creators || []);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setLoadingCreators(false);
    }
  };

  const fetchLiveCreators = async () => {
    try {
      setLoadingLiveCreators(true);
      const response = await axios.get("/api/creators/live");
      if (response.data.success) {
        setLiveCreators(response.data.creators || []);
      }
    } catch (error) {
      console.error("Error fetching live creators:", error);
    } finally {
      setLoadingLiveCreators(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const response = await axios.get("/api/user/subscriptions");
      if (response.data) {
        const paidSubscriptions = response.data.paidSubscriptions || [];
        const trialSubscriptions = response.data.trialSubscriptions || [];
        const allSubscriptions = [...paidSubscriptions, ...trialSubscriptions];
        setSubscriptions(allSubscriptions);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      setSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      
      // First try to sign out with NextAuth
      await signOut({
        callbackUrl: "/",
        redirect: false // Don't redirect automatically, we'll handle it manually
      });
      
      console.log("SignOut completed, redirecting to home...");
      
      // Manually redirect to home page
      router.push("/");
      
    } catch (error) {
      console.error("Logout error:", error);
      
      // Fallback: clear any local storage and redirect
      try {
        localStorage.removeItem("selectedLanguage");
        localStorage.removeItem("language");
        sessionStorage.clear();
      } catch (storageError) {
        console.error("Error clearing storage:", storageError);
      }
      
      // Force redirect to home page
      router.replace("/");
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const currentPost = post.find(p => p.id === postId);
      if (!currentPost) return;
      const isCurrentlyLiked = likedPosts.has(postId) || currentPost.isLiked;
      const newLikeCount = isCurrentlyLiked ? currentPost.likes - 1 : currentPost.likes + 1;

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      setPost(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? { ...p, likes: newLikeCount, isLiked: !isCurrentlyLiked }
            : p
        )
      );

      const response = await axios.post(`/api/posts/${postId}/like`);

      if (!response.data.success) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        setPost(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, likes: currentPost.likes, isLiked: currentPost.isLiked }
              : p
          )
        );
      }
    } catch (error) {
      const currentPost = post.find(p => p.id === postId);
      if (currentPost) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (likedPosts.has(postId)) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });

        setPost(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, likes: currentPost.likes, isLiked: currentPost.isLiked }
              : p
          )
        );
      }
    }
  };

  const toggleComments = (postId: string) => {
    setVisibleComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        fetchComments(postId);
      }
      return newSet;
    });
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => new Set(prev).add(postId));
      const response = await axios.get(`/api/posts/${postId}/comment`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      if (response.data.comments) {
        setComments(prev => ({
          ...prev,
          [postId]: response.data.comments
        }));
        setCommentCount(prev => ({
          ...prev,
          [postId]: response.data.comments.length
        }));
      } else {
        setComments(prev => ({
          ...prev,
          [postId]: []
        }));
        setCommentCount(prev => ({
          ...prev,
          [postId]: 0
        }));
      }
    } catch (error: any) {
      setComments(prev => ({
        ...prev,
        [postId]: []
      }));
      setCommentCount(prev => ({
        ...prev,
        [postId]: 0
      }));
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleTip = async (postId: string, creatorId: string) => {
    try {
      router.push(`/payment?postId=${postId}&creatorId=${creatorId}&type=tip`);
    } catch (error) {
      // nothing
    }
  };

  const handleShare = (postId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: `${window.location.origin}/post/${postId}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, type: 'paid' | 'trial') => {
    try {
      const response = await axios.post(`/api/subscribe/cancel-auto-pay`, {
        subscriptionId,
        type
      });
      if (response.data.success) {
        fetchSubscriptions();
      }
    } catch (error) {}
  };

  const handleRenewSubscription = async (subscriptionId: string, creatorId: string) => {
    try {
      const response = await axios.post(`/api/subscribe`, {
        creatorId,
        subscriptionId
      });
      if (response.data.success) {
        fetchSubscriptions();
      }
    } catch (error) {}
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;
    try {
      setSubmittingComments(prev => new Set(prev).add(postId));
      const newCommentCount = (commentCount[postId] || 0) + 1;
      setCommentCount(prev => ({ ...prev, [postId]: newCommentCount }));

      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: commentText,
        createdAt: new Date().toISOString(),
        user: {
          name: user?.name || 'You',
          profile: { avatarUrl: user?.image || null }
        }
      };

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimisticComment]
      }));

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const response = await axios.post(`/api/posts/${postId}/comment`, {
        content: commentText
      }, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });

      if (response.data.comment) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment =>
            comment.id === optimisticComment.id ? response.data.comment : comment
          )
        }));
        setCommentCount(prev => ({
          ...prev,
          [postId]: (comments[postId]?.length || 0) + 1
        }));
      } else {
        setCommentCount(prev => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] || 0) - 1)
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: commentText }));
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(comment => comment.id !== optimisticComment.id)
        }));
      }
    } catch (error) {
      setCommentCount(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1)
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: commentText }));
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(comment => comment.id !== `temp-${Date.now()}`)
      }));
    } finally {
      setSubmittingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/creator/${creatorId}`);
  };

  const handleLiveCreatorClick = (creatorId: string) => {
    router.push(`/livestream/${creatorId}`);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (status === "loading" || !t) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-8">
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-orange-500" />
              <span className="font-medium text-lg text-black dark:text-white">FanFeed</span>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                    activeTab === link.id ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {link.icon}
                  </div>
                  <span className="font-medium">{link.label}</span>
                </button>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* User Profile */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-orange-500 text-white">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900 dark:text-gray-100">{user?.name || "User"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex bg-gray-100 dark:bg-gray-900">
          {/* Left Content Area */}
          <div className="flex-1 max-w-3xl mx-auto px-4 py-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Find creators..."
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage(language === 'en' ? 'hi' : 'en');
                  }}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="max-w-6xl mx-auto">
                {activeTab === "feed" && (
                  <div className="space-y-6">
                    {loadingPosts ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading posts...</p>
                      </div>
                    ) : post.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Posts</h3>
                        <p className="text-gray-500 dark:text-gray-400">No posts available yet.</p>
                      </div>
                    ) : (
                      post.map((p) => (
                        <Card key={p.id} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                          <CardContent className="p-6">
                            {/* Post Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={p.creator.avatar} alt={p.creator.name} />
                                  <AvatarFallback className="bg-orange-500 text-white">
                                    {p.creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {translateContent(p.creator.name, 'name')}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{p.creator.handle} • {p.time}
                                  </p>
                                </div>
                              </div>
                              {p.isPaid && (
                                <Badge className="bg-orange-500 text-white">
                                  <Lock className="w-3 h-3 mr-1" />
                                  {p.price}
                                </Badge>
                              )}
                            </div>

                            {/* Post Content */}
                            <div className="mb-4">
                              <p className="text-gray-900 dark:text-gray-100 mb-3">
                                {translateContent(p.content, 'post')}
                              </p>
                              {p.image && (
                                <div className="relative">
                                  {p.isPaid && !p.isUnlocked ? (
                                    <div className="relative">
                                      <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                          <p className="text-gray-500 dark:text-gray-400 mb-2">Paid Content</p>
                                          <Button 
                                            onClick={() => handleTip(p.id, p.creator.id)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white"
                                          >
                                            Unlock {p.price}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={p.image} 
                                      alt="Post content" 
                                      className="w-full h-auto rounded-lg"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Post Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-6">
                                <button
                                  onClick={() => handleLikeToggle(p.id)}
                                  className={`flex items-center space-x-2 text-sm transition-colors ${
                                    likedPosts.has(p.id) || p.isLiked 
                                      ? "text-red-500" 
                                      : "text-gray-500 hover:text-red-500"
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${likedPosts.has(p.id) || p.isLiked ? "fill-current" : ""}`} />
                                  <span>{p.likes}</span>
                                </button>
                                
                                <button
                                  onClick={() => toggleComments(p.id)}
                                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{commentCount[p.id] || p.comments}</span>
                                </button>

                                <button
                                  onClick={() => handleShare(p.id)}
                                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors"
                                >
                                  <Share className="w-4 h-4" />
                                  <span>Share</span>
                                </button>
                              </div>

                              {p.isPaid && (
                                <Button
                                  onClick={() => handleTip(p.id, p.creator.id)}
                                  size="sm"
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Tip
                                </Button>
                              )}
                            </div>

                            {/* Comments Section */}
                            {visibleComments.has(p.id) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-3 mb-4">
                                  {comments[p.id]?.map((comment) => (
                                    <div key={comment.id} className="flex space-x-3">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={comment.user.profile.avatarUrl} />
                                        <AvatarFallback className="text-xs">
                                          {comment.user.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {comment.user.name}
                                          </p>
                                          <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {comment.content}
                                          </p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {comment.createdAt}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Input
                                    placeholder="Add a comment..."
                                    value={commentInputs[p.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={() => handleCommentSubmit(p.id)}
                                    disabled={submittingComments.has(p.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                  >
                                    {submittingComments.has(p.id) ? "Posting..." : "Post"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "creators" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Top Creators</h2>
                      <Input
                        placeholder="Search creators..."
                        value={creatorSearchTerm}
                        onChange={(e) => setCreatorSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    
                    {loadingCreators ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading creators...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCreators.map((creator) => (
                          <Card key={creator.id} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={creator.avatar} alt={creator.name} />
                                  <AvatarFallback className="bg-orange-500 text-white">
                                    {creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {translateContent(creator.name, 'name')}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{creator.handle}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{creator.subscriberCount} subscribers</span>
                                    <span>{creator.postCount} posts</span>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleCreatorClick(creator.id)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  {creator.subscribed ? "Subscribed" : "Subscribe"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "live-creators" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Live Creators</h2>
                    
                    {loadingLiveCreators ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading live creators...</p>
                      </div>
                    ) : liveCreators.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Live Creators</h3>
                        <p className="text-gray-500 dark:text-gray-400">No creators are currently live streaming.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveCreators.map((creator) => (
                          <Card key={creator.id} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={creator.avatar} alt={creator.name} />
                                  <AvatarFallback className="bg-orange-500 text-white">
                                    {creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {translateContent(creator.name, 'name')}
                                    </h3>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{creator.handle}
                                  </p>
                                  <p className="text-sm text-red-500 font-medium mt-1">Live Now</p>
                                </div>
                                <Button
                                  onClick={() => handleLiveCreatorClick(creator.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Watch
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Subscriptions</h2>
                    
                    {loadingSubscriptions ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading subscriptions...</p>
                      </div>
                    ) : subscriptions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Subscriptions</h3>
                        <p className="text-gray-500 dark:text-gray-400">You haven't subscribed to any creators yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map((subscription) => (
                          <Card key={subscription.id} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.name} />
                                    <AvatarFallback className="bg-orange-500 text-white">
                                      {subscription.creator.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {translateContent(subscription.creator.name, 'name')}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {subscription.type === 'trial' ? 'Trial Subscription' : 'Paid Subscription'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Expires on: {subscription.expiresAt}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleCancelSubscription(subscription.id, subscription.type)}
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    Cancel
                                  </Button>
                                  {subscription.type === 'trial' && (
                                    <Button
                                      onClick={() => handleRenewSubscription(subscription.id, subscription.creator.id)}
                                      className="bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                      Renew
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "product-store" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Store</h2>
                    <p className="text-gray-500 dark:text-gray-400">Browse and purchase amazing products from creators.</p>
                  </div>
                )}

                {activeTab === "my-products" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Products</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your purchased products and digital content.</p>
                  </div>
                )}

                {activeTab === "chats" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
                    <p className="text-gray-500 dark:text-gray-400">Connect with creators and other users through chat.</p>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
