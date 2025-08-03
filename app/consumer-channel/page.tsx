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
    { id: "feed", label: t.feed, href: "#", icon: <Home className="w-6 h-6" /> },
    { id: "creators", label: t.creators, href: "#", icon: <Users className="w-6 h-6" /> },
    { id: "product-store", label: t.productStore, href: "#", icon: <ShoppingBag className="w-6 h-6" /> },
    { id: "my-products", label: t.myProducts, href: "#", icon: <Settings className="w-6 h-6" /> },
    { id: "subscriptions", label: t.subscriptions, href: "#", icon: <CreditCard className="w-6 h-6" /> },
    { id: "live-creators", label: t.liveCreators, href: "#", icon: <Users className="w-6 h-6" /> },
    { id: "chats", label: t.chats, href: "#", icon: <MessageCircle className="w-6 h-6" /> },
    { id: "settings", label: t.settings, href: "#", icon: <SettingsIcon className="w-6 h-6" /> },
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
      // Load all data in parallel for better performance
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

  // Refetch posts when language changes (but not on initial load)
  useEffect(() => {
    if (status === "authenticated" && !initialLoading) {
      fetchAndSetPosts();
    }
  }, [language]);

  // Fetch comments for posts that have comments when posts are loaded
  useEffect(() => {
    if (post.length > 0) {
      post.forEach(p => {
        if (p.comments > 0 && !comments[p.id]) {
          // Fetch comments for posts that have comments but haven't been loaded yet
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
      console.log("🔍 Fetching subscriptions...");
      const response = await axios.get("/api/user/subscriptions");
      console.log("📄 Subscription response:", response.data);
      
      if (response.data) {
        // Combine paid and trial subscriptions into a single array
        const paidSubscriptions = response.data.paidSubscriptions || [];
        const trialSubscriptions = response.data.trialSubscriptions || [];
        const allSubscriptions = [...paidSubscriptions, ...trialSubscriptions];
        console.log("✅ Combined subscriptions:", allSubscriptions);
        setSubscriptions(allSubscriptions);
      } else {
        console.log("❌ No data in response");
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching subscriptions:", error);
      if (error.response) {
        console.error("❌ Error response:", error.response.data);
        console.error("❌ Error status:", error.response.status);
      }
      setSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback to manual redirect
      router.replace("/");
    }
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      // Optimistic update
      const currentPost = post.find(p => p.id === postId);
      if (!currentPost) return;

      const isCurrentlyLiked = likedPosts.has(postId) || currentPost.isLiked;
      const newLikeCount = isCurrentlyLiked ? currentPost.likes - 1 : currentPost.likes + 1;

      // Update UI immediately
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

      // Make API call
      const response = await axios.post(`/api/posts/${postId}/like`);
      
      if (!response.data.success) {
        // Revert optimistic update on error
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
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
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
        // Fetch comments when opening
        fetchComments(postId);
      }
      return newSet;
    });
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => new Set(prev).add(postId));
      console.log("🔍 Fetching comments for post:", postId);
      
      const response = await axios.get(`/api/posts/${postId}/comment`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });
      console.log("📄 Comments response:", response.data);
      
      if (response.data.comments) {
        setComments(prev => ({
          ...prev,
          [postId]: response.data.comments
        }));
        setCommentCount(prev => ({
          ...prev,
          [postId]: response.data.comments.length
        }));
        console.log("✅ Comments loaded:", response.data.comments.length);
      } else {
        console.log("❌ No comments in response");
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
      console.error("❌ Error fetching comments:", error);
      if (error.response) {
        console.error("❌ Error response:", error.response.data);
        console.error("❌ Error status:", error.response.status);
      }
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
      // Navigate to payment page for tipping
      router.push(`/payment?postId=${postId}&creatorId=${creatorId}&type=tip`);
    } catch (error) {
      console.error("Error handling tip:", error);
    }
  };

  const handleShare = (postId: string) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post',
        url: `${window.location.origin}/post/${postId}`
      });
    } else {
      // Fallback: copy to clipboard
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
        // Refresh subscriptions
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    }
  };

  const handleRenewSubscription = async (subscriptionId: string, creatorId: string) => {
    try {
      const response = await axios.post(`/api/subscribe`, {
        creatorId,
        subscriptionId
      });
      
      if (response.data.success) {
        // Refresh subscriptions
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      setSubmittingComments(prev => new Set(prev).add(postId));
      
      // Optimistic update
      const newCommentCount = (commentCount[postId] || 0) + 1;
      setCommentCount(prev => ({ ...prev, [postId]: newCommentCount }));
      
      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content: commentText,
        createdAt: new Date().toISOString(),
        user: {
          name: user?.name || 'You',
          profile: { avatarUrl: user?.image || null }
        }
      };
      
      // Add to comments list
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimisticComment]
      }));
      
      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const response = await axios.post(`/api/posts/${postId}/comment`, {
        content: commentText
      }, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken || ''}`
        }
      });

      if (response.data.comment) {
        // Replace optimistic comment with real one
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => 
            comment.id === optimisticComment.id ? response.data.comment : comment
          )
        }));
        // Update comment count based on actual comments length
        setCommentCount(prev => ({ 
          ...prev, 
          [postId]: (comments[postId]?.length || 0) + 1
        }));
      } else {
        // Revert optimistic update on error
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
      console.error("Error submitting comment:", error);
      // Revert optimistic update on error
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

  if (status === "loading") {
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
                <span className="font-medium">{t.logout}</span>
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
                    placeholder={t.findCreators}
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
                        <p className="text-gray-500 dark:text-gray-400 mt-4">{t.loadingPosts}</p>
                      </div>
                    ) : post.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">📱</div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">
                          {t.noPostsYet}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          {t.postsFromCreators}
                        </p>
                        <Button
                          onClick={() => setActiveTab('creators')}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {t.findCreatorsButton}
                        </Button>
                      </div>
                    ) : (
                      post.map((post) => (
                        <Card key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                          <CardContent className="p-4">
                            {/* Post Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                    {post.creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <button
                                    onClick={() => handleCreatorClick(post.creator.id)}
                                    className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-orange-500 transition-colors cursor-pointer text-left"
                                  >
                                    {post.creator.name}
                                  </button>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                                    {new Date(post.time).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 h-8 w-8 p-0">
                                <SettingsIcon className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Post Content */}
                            <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">{translateContent(post.content, 'post')}</p>

                            {/* Post Image */}
                            {post.image && (
                              <div className="mb-3 relative">
                                <img
                                  src={post.image}
                                  alt="Post content"
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                                {/* Paywall Overlay */}
                                {post.isPaid && !post.isUnlocked && (
                                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                    <div className="text-center text-white">
                                      <Lock className="w-8 h-8 mx-auto mb-2" />
                                      <p className="font-bold mb-2">Paid Content</p>
                                      <p className="text-sm mb-4">
                                        Subscribe to unlock this post for ${post.price}
                                      </p>
                                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                        Unlock Now
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-6">
                                <button
                                  onClick={() => handleLikeToggle(post.id)}
                                  className={`flex items-center gap-1 text-xs ${
                                    likedPosts.has(post.id) || post.isLiked
                                      ? "text-red-500"
                                      : "text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
                                  } transition-colors`}
                                >
                                  <Heart className={`w-4 h-4 ${likedPosts.has(post.id) || post.isLiked ? "fill-current" : ""}`} />
                                  <span>{post.likes}</span>
                                </button>

                                <button
                                  className={`flex items-center gap-1 text-xs ${
                                    visibleComments.has(post.id)
                                      ? "text-blue-500"
                                      : "text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-500"
                                  } transition-colors`}
                                  onClick={() => toggleComments(post.id)}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{comments[post.id]?.length || commentCount[post.id] || 0}</span>
                                  {(comments[post.id]?.length > 0 || commentCount[post.id] > 0) && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {visibleComments.has(post.id) ? t.hide : t.show}
                                    </span>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleTip(post.id, post.creator.id)}
                                  className="flex items-center gap-1 text-xs text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  <span>{t.tip}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={() => handleShare(post.id)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                >
                                  <Share className="w-4 h-4" />
                                </button>
                                
                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                                  <Bookmark className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {visibleComments.has(post.id) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2 mb-3">
                                  <Input
                                    type="text"
                                    placeholder={t.addComment}
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ 
                                      ...prev, 
                                      [post.id]: e.target.value 
                                    }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleCommentSubmit(post.id);
                                      }
                                    }}
                                    className="flex-1 text-sm bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                    disabled={submittingComments.has(post.id)}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleCommentSubmit(post.id)}
                                    disabled={!commentInputs[post.id]?.trim() || submittingComments.has(post.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3"
                                  >
                                    {submittingComments.has(post.id) ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      t.post
                                    )}
                                  </Button>
                                </div>
                                
                                {/* Comments list would go here */}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {loadingComments.has(post.id) ? (
                                    <div className="flex items-center justify-center py-4">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                                    </div>
                                  ) : comments[post.id]?.length > 0 ? (
                                    <div className="space-y-2">
                                      {comments[post.id].map((comment, index) => (
                                        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                          <Avatar className="w-6 h-6">
                                            <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} />
                                            <AvatarFallback className="text-xs">
                                              {comment.user?.name?.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                              {comment.user?.name}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                              {comment.content}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-400">
                                      {t.noComments}
                                    </div>
                                  )}
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
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600">Creators</h3>
                    <p className="text-gray-500">Discover amazing creators here.</p>
                  </div>
                )}

                {activeTab === "product-store" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">Product Store</h3>
                    <p className="text-gray-500 dark:text-gray-400">Browse and purchase amazing products from creators.</p>
                  </div>
                )}

                {activeTab === "my-products" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">My Products</h3>
                    <p className="text-gray-500 dark:text-gray-400">Manage your purchased products here.</p>
                  </div>
                )}

                {activeTab === "live-creators" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.liveCreators}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{t.watchLiveCreators}</p>
                      </div>
                      <Badge className="bg-red-500 text-white">
                        {liveCreators.length} {t.liveNow}
                      </Badge>
                    </div>

                    {loadingLiveCreators ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                      </div>
                    ) : liveCreators.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔴</div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">{t.noLiveCreators}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t.noCreatorsLive}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveCreators.map((creator) => (
                          <Card 
                            key={creator.id} 
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleLiveCreatorClick(creator.id)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-10 h-10 ring-2 ring-red-500/20">
                                  <AvatarImage src={creator.avatar} alt={translateContent(creator.name, 'name')} />
                                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                    {translateContent(creator.name, 'name').charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{translateContent(creator.name, 'name')}</div>
                                  <div className="text-gray-500 dark:text-gray-400 text-sm">{creator.handle}</div>
                                </div>
                                <Badge className="bg-red-500 text-white">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                                  {t.liveNow}
                                </Badge>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{t.subscribers}</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{creator.subscriberCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{t.status}</span>
                                  <span className="text-red-500 font-medium">{t.liveNowStatus}</span>
                                </div>
                              </div>

                              <Button 
                                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLiveCreatorClick(creator.id);
                                }}
                              >
                                {t.watchLive}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "chats" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">{t.chats}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t.connectWithCreators}</p>
                  </div>
                )}

                {activeTab === "store" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">{t.productStore}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t.shopProducts}</p>
                  </div>
                )}

                {activeTab === "subscriptions" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.subscriptions}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{t.manageSubscriptions}</p>
                      </div>
                      <Badge className="bg-orange-500 text-white">
                        {subscriptions.length} {t.activeSubscriptions}
                      </Badge>
                    </div>

                    {loadingSubscriptions ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                      </div>
                    ) : subscriptions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">💳</div>
                        <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">{t.noSubscriptions}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          {t.noSubscriptionsYet}
                        </p>
                        <Button
                          onClick={() => setActiveTab('creators')}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {t.discoverCreators}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {t.showingSubscriptions} {subscriptions.length} {subscriptions.length !== 1 ? t.subscriptions : t.subscription}
                        </div>
                        
                        {/* Three Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Paid Subscriptions */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Badge className="bg-green-500 text-white">{t.paid}</Badge>
                              <span className="text-sm text-gray-500">
                                ({subscriptions.filter(s => s.type === 'paid' && s.status === 'active').length})
                              </span>
                            </h3>
                            <div className="space-y-3">
                              {subscriptions
                                .filter(sub => sub.type === 'paid' && sub.status === 'active')
                                .map((subscription, index) => (
                                  <Card key={`${subscription.id}-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="w-10 h-10 ring-2 ring-green-500/20">
                                            <AvatarImage src={subscription.creator.avatar} alt={translateContent(subscription.creator.name, 'name')} />
                                            <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                              {translateContent(subscription.creator.name, 'name').charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {t.started} {new Date(subscription.startedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleCancelSubscription(subscription.id, subscription.type)}
                                          variant="outline"
                                          size="sm"
                                          className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          {t.cancel}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>

                          {/* Free Trial Subscriptions */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Badge className="bg-blue-500 text-white">{t.freeTrial}</Badge>
                              <span className="text-sm text-gray-500">
                                ({subscriptions.filter(s => s.type === 'trial' && s.status === 'active').length})
                              </span>
                            </h3>
                            <div className="space-y-3">
                              {subscriptions
                                .filter(sub => sub.type === 'trial' && sub.status === 'active')
                                .map((subscription, index) => (
                                  <Card key={`${subscription.id}-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="w-10 h-10 ring-2 ring-blue-500/20">
                                            <AvatarImage src={subscription.creator.avatar} alt={translateContent(subscription.creator.name, 'name')} />
                                            <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                              {translateContent(subscription.creator.name, 'name').charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {subscription.remainingTime} {t.remaining}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {t.started} {new Date(subscription.startedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleCancelSubscription(subscription.id, subscription.type)}
                                          variant="outline"
                                          size="sm"
                                          className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          {t.cancel}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>

                          {/* Cancelled/Expired Subscriptions */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Badge className="bg-gray-500 text-white">{t.cancelled}</Badge>
                              <span className="text-sm text-gray-500">
                                ({subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length})
                              </span>
                            </h3>
                            <div className="space-y-3">
                              {subscriptions
                                .filter(sub => sub.status === 'expired' || sub.status === 'cancelled')
                                .map((subscription, index) => (
                                  <Card key={`${subscription.id}-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm opacity-75">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="w-10 h-10 ring-2 ring-gray-500/20">
                                            <AvatarImage src={subscription.creator.avatar} alt={translateContent(subscription.creator.name, 'name')} />
                                            <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                              {translateContent(subscription.creator.name, 'name').charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {subscription.type === 'trial' ? t.trialExpired : t.subscriptionCancelled}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {t.started} {new Date(subscription.startedAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                        {subscription.type === 'trial' && subscription.status === 'expired' ? (
                                          <Button
                                            onClick={() => handleRenewSubscription(subscription.id, subscription.creatorId)}
                                            size="sm"
                                            className="bg-orange-500 hover:bg-orange-600 text-white"
                                          >
                                            {t.renew}
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-gray-400">{t.cancelled}</span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-300">Settings</h3>
                    <p className="text-gray-500 dark:text-gray-400">Configure your account settings here.</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Right Sidebar - Top Creators */}
          <aside className="w-80 flex-shrink-0 p-4 overflow-y-auto bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 pb-4">
              {/* Find Creator Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={t.findCreators}
                    value={creatorSearchTerm}
                    onChange={(e) => setCreatorSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.topCreators}</h3>
              </div>

              <div className="space-y-3">
                {loadingCreators ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : filteredCreators.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">{t.noCreatorsFound}</div>
                  </div>
                ) : (
                  filteredCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-100 dark:border-gray-600"
                      onClick={() => handleCreatorClick(creator.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-orange-500/20">
                          <AvatarImage src={creator.avatar} alt={translateContent(creator.name, 'name')} />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                            {translateContent(creator.name, 'name').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm hover:text-orange-500 transition-colors">
                            {creator.name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">@{creator.handle}</div>
                        </div>
                      </div>

                      {creator.subscribed ? (
                        <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 border">
                          {t.following}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle follow action here
                          }}
                        >
                          {t.follow}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}