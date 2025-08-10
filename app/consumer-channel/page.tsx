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
  Globe,
  X,
  Clock,
  XCircle,
  User,
  Camera,
  Mail,
  Loader2,
  Save,
  Trash2
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Socket, io } from "socket.io-client";

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
  const [tipAmounts, setTipAmounts] = useState<{ [key: string]: number }>({});
  const [showTipModal, setShowTipModal] = useState(false);
  const [currentTipPost, setCurrentTipPost] = useState<{ postId: string; creatorId: string } | null>(null);
  const [tipInput, setTipInput] = useState('');
  const [submittingTip, setSubmittingTip] = useState(false);
  const [subscriptionFilter, setSubscriptionFilter] = useState<'paid' | 'trial' | 'cancelled'>('paid');
  
  // Settings state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    avatarUrl: null as string | null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State for sidebar display - this will be updated after successful save
  const [displayUserData, setDisplayUserData] = useState({
    name: '',
    email: '',
    avatarUrl: null as string | null
  });

  // Photo management modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // DM Chat (chat-test style) state
  interface TestMessage { id: string; text: string; senderId: string; senderName: string; timestamp: Date }
  interface DmTab { id: string; targetUserId: string; targetUserName?: string; roomId: string; messages: TestMessage[]; unreadCount: number }
  const [dmSocket, setDmSocket] = useState<Socket | null>(null);
  const [dmTabs, setDmTabs] = useState<DmTab[]>([]);
  const [activeDmTabId, setActiveDmTabId] = useState<string | null>(null);
  const [pendingDmMessages, setPendingDmMessages] = useState<TestMessage[]>([]);
  const [processedDmIds, setProcessedDmIds] = useState<Set<string>>(new Set());
  const [newChatUserId, setNewChatUserId] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // Load chat tabs from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const savedTabs = localStorage.getItem(`dmTabs_${user.id}`);
      const savedActiveTab = localStorage.getItem(`activeDmTab_${user.id}`);
      
      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs);
          // Convert timestamp strings back to Date objects
          const tabsWithDates = parsedTabs.map((tab: any) => ({
            ...tab,
            messages: tab.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          
          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            setDmTabs(tabsWithDates);
            
            if (savedActiveTab && tabsWithDates.find((tab: any) => tab.id === savedActiveTab)) {
              setActiveDmTabId(savedActiveTab);
            }

            // Refresh messages for all tabs from database
            tabsWithDates.forEach(async (tab: DmTab) => {
              try {
                const messagesResponse = await axios.get(`/api/messages?roomId=${tab.roomId}`);
                if (messagesResponse.data.success && messagesResponse.data.messages.length > 0) {
                  setDmTabs(prevTabs => 
                    prevTabs.map(prevTab => 
                      prevTab.id === tab.id 
                        ? { ...prevTab, messages: messagesResponse.data.messages }
                        : prevTab
                    )
                  );
                }
              } catch (error) {
                console.log(`No new messages found for room ${tab.roomId}`);
              }
            });
          }, 0);
        } catch (error) {
          console.error('Error loading saved chat tabs:', error);
        }
      }
    }
  }, [user?.id]);

  // Save chat tabs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id && dmTabs.length > 0) {
      localStorage.setItem(`dmTabs_${user.id}`, JSON.stringify(dmTabs));
    }
  }, [dmTabs, user?.id]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id && activeDmTabId) {
      localStorage.setItem(`activeDmTab_${user.id}`, activeDmTabId);
    }
  }, [activeDmTabId, user?.id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2,11)}-${Math.random().toString(36).slice(2,6)}`;

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
    );

  const fetchAndSetPosts = async () => {
    try {
      setLoadingPosts(true);
      console.log("Fetching posts with language:", language);
      const response = await axios.get(`/api/posts?lang=${language}`);
      console.log("Posts response:", response.data);
      if (response.data.success) {
        setPost(response.data.posts);
      } else {
        console.log("Posts response not successful:", response.data);
        setPost([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPost([]);
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
        fetchSubscriptions(),
        fetchUserTips()
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

  // Initialize user data for settings
  useEffect(() => {
    if (session?.user) {
      const fetchUserProfile = async () => {
        try {
          console.log('Fetching user profile for session user:', session.user);
          const response = await fetch('/api/user/profile');
          console.log('Profile fetch response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Profile data received:', data);
            const profileData = {
              name: data.user.name || '',
              email: data.user.email || '',
              avatarUrl: data.user.image || null
            };
            setUserData(profileData);
            setDisplayUserData(profileData); // Also set display data
          } else {
            console.error('Failed to fetch profile, status:', response.status);
            // Fallback to session data
            const fallbackData = {
              name: (session.user as any).name || '',
              email: (session.user as any).email || '',
              avatarUrl: (session.user as any).image || null
            };
            setUserData(fallbackData);
            setDisplayUserData(fallbackData);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Fallback to session data on error
          const fallbackData = {
            name: (session.user as any).name || '',
            email: (session.user as any).email || '',
            avatarUrl: (session.user as any).image || null
          };
          setUserData(fallbackData);
          setDisplayUserData(fallbackData);
        }
      };
      fetchUserProfile();
    }
  }, [session]);

  // --- DM Chat: auto-connect using session user ---
  const activeDmTab = dmTabs.find(t => t.id === activeDmTabId) || null;
  useEffect(() => {
    if (activeTab !== 'chats' || status !== 'authenticated' || !user) return;
    // Create socket instance
    const URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    const s = io(URL, { reconnectionAttempts: 5, reconnectionDelay: 1000, autoConnect: false, withCredentials: false });
    setDmSocket(s);
    s.on('connect', () => {
      console.log('WebSocket connected, rejoining rooms');
      s.emit('join', { userId: user.id, userName: user.name || 'User' });
      
      // Rejoin all existing chat rooms
      dmTabs.forEach(tab => {
        s.emit('joinRoom', { roomId: tab.roomId, userId: user.id, targetUserId: tab.targetUserId });
      });
    });
    s.on('disconnect', () => {
      console.log('WebSocket disconnected - chat tabs preserved');
      // Don't clear chat tabs on disconnect - they're persisted in localStorage
    });
    s.on('connect_error', () => {
      // no alert spam in integrated UI
      console.error('WebSocket connect error - ensure server running on 3001');
    });
    s.on('receiveMessage', (message: any) => {
      console.log('Received new message:', message);
      if (processedDmIds.has(message.id)) return;
      setProcessedDmIds(prev => new Set(prev).add(message.id));
      
      // Convert server message format to our format
      const convertedMessage: TestMessage = {
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: new Date(message.timestamp)
      };
      
      // Don't show messages from yourself (they're already added when sending)
      if (message.senderId === user.id) return;
      
      setDmTabs(prev => {
        const existing = prev.find(t => t.targetUserId === message.senderId);
        if (existing) {
          const exists = existing.messages.some(m => m.id === message.id);
          if (exists) return prev;
          return prev.map(t => t.targetUserId === message.senderId ? { ...t, messages: [...t.messages, convertedMessage], unreadCount: t.id === activeDmTabId ? 0 : t.unreadCount + 1 } : t);
        } else {
          // Auto-create new chat tab for incoming message
          console.log('Creating new chat tab for incoming message from:', message.senderName);
          const participants = [user.id, message.senderId].sort();
          const roomId = `dm_${participants.join('_')}`;
          const tabId = generateId();
          
          const newTab: DmTab = { 
            id: tabId, 
            targetUserId: message.senderId, 
            targetUserName: message.senderName,
            roomId, 
            messages: [
              { id: generateId(), text: `🏠 Started chat with ${message.senderName}`, senderId: 'system', senderName: 'System', timestamp: new Date() },
              convertedMessage
            ], 
            unreadCount: 1 // Mark as unread since it's a new message
          };
          
          return [...prev, newTab];
        }
      });
      
      // Show a notification for the new message
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${message.senderName}`, {
            body: message.text,
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(`New message from ${message.senderName}`, {
                body: message.text,
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
    });
    
    s.on('message_sent', (message: any) => {
      console.log('Message sent confirmation:', message);
      // This is just a confirmation, the message is already added to UI
    });
    
    s.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
    
    s.on('autoCreateChat', (data: { targetUserId: string; targetUserName: string; roomId: string }) => {
      setDmTabs(prev => {
        const exists = prev.find(t => t.targetUserId === data.targetUserId);
        if (exists) return prev;
        const tabId = generateId();
        const newTab: DmTab = { id: tabId, targetUserId: data.targetUserId, targetUserName: data.targetUserName, roomId: data.roomId, messages: [{ id: generateId(), text: `🏠 Chat created with ${data.targetUserName || data.targetUserId}`, senderId: 'system', senderName: 'System', timestamp: new Date() }], unreadCount: 1 };
        s.emit('joinRoom', { roomId: data.roomId, userId: user.id, targetUserId: data.targetUserId });
        return [...prev, newTab];
      });
      setPendingDmMessages(prev => {
        const toThis = prev.filter(m => m.senderId === data.targetUserId);
        if (toThis.length) {
          setDmTabs(current => current.map(t => t.targetUserId === data.targetUserId ? { ...t, messages: [...t.messages, ...toThis], unreadCount: t.unreadCount + toThis.length } : t));
        }
        return prev.filter(m => m.senderId !== data.targetUserId);
      });
    });
    s.connect();
    return () => { try { s.disconnect(); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status, user?.id]);

  const createNewChat = async () => {
    if (!dmSocket || !newChatUserId || !user) {
      console.log("Cannot create chat:", { dmSocket: !!dmSocket, newChatUserId, user: !!user });
      return;
    }
    if (newChatUserId === user.id) {
      console.log("Cannot chat with yourself");
      return;
    }
    
    console.log("Creating new chat with:", newChatUserId);
    
    try {
      // Try to get user name from search results first (if clicked from search)
      let targetUserName = newChatUserId;
      
      // Check if we have this user in search results
      const foundUser = searchResults.find(u => u.id === newChatUserId);
      if (foundUser) {
        targetUserName = foundUser.name;
        console.log("Found user in search results:", foundUser.name);
      } else {
        // Try to fetch user details from API by exact ID
        try {
          const response = await axios.get(`/api/users/search?id=${newChatUserId}`);
          if (response.data.success && response.data.users.length > 0) {
            const targetUser = response.data.users[0];
            targetUserName = targetUser.name;
            console.log("Found user via API by ID:", targetUser.name);
          }
        } catch (apiError) {
          console.error("Error fetching user details:", apiError);
        }
      }
      
      const participants = [user.id, newChatUserId].sort();
      const roomId = `dm_${participants.join('_')}`;
      const tabId = generateId();
      
      console.log("Joining room:", roomId);
      dmSocket.emit('joinRoom', { roomId, userId: user.id, targetUserId: newChatUserId });
      
      // Load existing messages for this room
      let existingMessages: TestMessage[] = [];
      try {
        const messagesResponse = await axios.get(`/api/messages?roomId=${roomId}`);
        if (messagesResponse.data.success) {
          existingMessages = messagesResponse.data.messages;
          console.log("Loaded existing messages:", existingMessages.length);
        }
      } catch (error) {
        console.log("No existing messages found for this room");
      }
      
      const newTab: DmTab = { 
        id: tabId, 
        targetUserId: newChatUserId, 
        targetUserName: targetUserName,
        roomId, 
        messages: existingMessages.length > 0 ? existingMessages : [{ id: generateId(), text: `🏠 Started chat with ${targetUserName}`, senderId: 'system', senderName: 'System', timestamp: new Date() }], 
        unreadCount: 0 
      };
      
      console.log("Creating new tab:", newTab);
      setDmTabs(prev => [...prev, newTab]);
      setActiveDmTabId(tabId);
      setNewChatUserId("");
      
      console.log("Chat created successfully!");
    } catch (error) {
      console.error("Error creating chat:", error);
      // Fallback to using user ID if name fetch fails
      const participants = [user.id, newChatUserId].sort();
      const roomId = `dm_${participants.join('_')}`;
      const tabId = generateId();
      dmSocket.emit('joinRoom', { roomId, userId: user.id, targetUserId: newChatUserId });
      const newTab: DmTab = { 
        id: tabId, 
        targetUserId: newChatUserId, 
        targetUserName: newChatUserId,
        roomId, 
        messages: [{ id: generateId(), text: `🏠 Started chat with ${newChatUserId}`, senderId: 'system', senderName: 'System', timestamp: new Date() }], 
        unreadCount: 0 
      };
      setDmTabs(prev => [...prev, newTab]);
      setActiveDmTabId(tabId);
      setNewChatUserId("");
    }
  };

  const sendDm = async () => {
    if (!dmSocket || !activeDmTab || !user || !messageInput.trim()) return;
    
    const messageText = messageInput.trim();
    setMessageInput(""); // Clear input immediately
    
    // Create message object for UI
    const message: TestMessage = { 
      id: generateId(), 
      text: messageText, 
      senderId: user.id, 
      senderName: user.name || 'User', 
      timestamp: new Date() 
    };
    
    // Add message to UI immediately
    setDmTabs(prev => prev.map(t => t.id === activeDmTabId ? { 
      ...t, 
      messages: [...t.messages, message] 
    } : t));
    
    try {
      // Save message to database
      const response = await axios.post('/api/messages', {
        roomId: activeDmTab.roomId,
        content: messageText
      });
      
      if (response.data.success) {
        console.log("Message saved to database successfully");
      }
    } catch (error) {
      console.error("Error saving message to database:", error);
      // Message is still in UI, just not saved to DB
    }
    
    // Send to websocket for real-time delivery (optional)
    try {
      dmSocket.emit('sendMessage', { 
        conversationId: activeDmTab.roomId,
        content: messageText
      });
      console.log("Message sent via websocket");
    } catch (wsError) {
      console.error("Error sending via websocket:", wsError);
      // Message is still in UI and saved to DB
    }
  };
  const handleDmKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDm(); } };

  const handleResolveChatId = (oldId: string, newId: string) => {
    // Update chat id when placeholder conversation is created
    // This function is kept for compatibility with existing DM functionality
  };

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  // Start chat with selected user
  const startChatWithUser = (user: { id: string; name: string; email: string; role: string }) => {
    if (!user || user.id === (session?.user as any)?.id) return;
    
    console.log("Starting chat with user:", user);
    
    // Fill the manual entry field with the selected user's ID
    setNewChatUserId(user.id);
    
    // Clear search results and query
    setSearchQuery("");
    setSearchResults([]);
    
    // Automatically create the chat
    setTimeout(() => {
      createNewChat();
    }, 100);
  };

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

  const fetchUserTips = async () => {
    try {
      const response = await axios.get("/api/user/tips");
      if (response.data.success) {
        const tipsMap: { [key: string]: number } = {};
        response.data.tips.forEach((tip: any) => {
          tipsMap[tip.postId] = tip.amount;
        });
        setTipAmounts(tipsMap);
      }
    } catch (error) {
      console.error("Error fetching user tips:", error);
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
    setCurrentTipPost({ postId, creatorId });
    setShowTipModal(true);
    setTipInput('');
  };

  const handleTipSubmit = async () => {
    if (!currentTipPost || !tipInput.trim()) return;
    
    const amount = parseFloat(tipInput);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setSubmittingTip(true);
      const response = await axios.post(`/api/posts/${currentTipPost.postId}/tip`, {
        tipAmount: amount
      });

      if (response.data.message === "Tip sent successfully") {
        // Update the tip amount for this post (add to existing amount)
        setTipAmounts(prev => ({
          ...prev,
          [currentTipPost.postId]: (prev[currentTipPost.postId] || 0) + amount
        }));
        
        setShowTipModal(false);
        setCurrentTipPost(null);
        setTipInput('');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      alert('Failed to send tip. Please try again.');
    } finally {
      setSubmittingTip(false);
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

  const handleUnlock = async (postId: string) => {
    try {
      const response = await axios.post("/api/payment/unlock-media", { postId });
      
      if (response.data.success && response.data.unlocked) {
        // Update the post to show as unlocked
        setPost(prev => prev.map(p => 
          p.id === postId ? { ...p, isUnlocked: true } : p
        ));
      }
    } catch (error) {
      console.error("Error unlocking media:", error);
      alert("Failed to unlock content. Please try again.");
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

  // Settings functions
  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      console.log('Starting avatar upload for file:', file.name, 'Size:', file.size);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      console.log('Sending upload request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to upload avatar: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful, returned data:', data);
      
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      
      return data.url;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!session?.user) return;

    setIsSaving(true);
    try {
      let avatarUrl = userData.avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        console.log('Uploading new avatar file:', avatarFile.name);
        avatarUrl = await uploadAvatar(avatarFile);
        console.log('Avatar uploaded successfully, URL:', avatarUrl);
      }

      console.log('Updating user profile with data:', {
        name: userData.name,
        email: userData.email,
        avatarUrl: avatarUrl,
      });

      // Update user data
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          avatarUrl: avatarUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Profile update successful:', result);

      // Update local state with new avatar URL
      setUserData(prev => ({
        ...prev,
        avatarUrl: avatarUrl,
      }));

      // Update display data for sidebar
      setDisplayUserData({
        name: userData.name,
        email: userData.email,
        avatarUrl: avatarUrl,
      });

      // Force a session refresh by calling the session API
      await fetch('/api/auth/session', { method: 'GET' });
      
      // Update the session data in the component
      if (session) {
        // Update the session object directly
        (session.user as any).name = userData.name;
        (session.user as any).email = userData.email;
        (session.user as any).image = avatarUrl;
      }

      alert('Profile updated successfully!');
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setAvatarFile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
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
    <div className={`h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'} overflow-hidden`}>
      <div className="flex h-full">
        {/* Left Sidebar - Fixed */}
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="p-6 h-full flex flex-col">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-8">
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-orange-500" />
              <span className="font-medium text-lg text-black dark:text-white">FanFeed</span>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2 flex-1">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                  }}
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
            <div className="pt-6 pb-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={displayUserData.avatarUrl || user?.image || undefined} 
                    alt={displayUserData.name || user?.name || "User"} 
                  />
                  <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                    {(displayUserData.name || user?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {displayUserData.name || user?.name || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Fixed Height */}
        <div className="flex-1 flex bg-gray-100 dark:bg-gray-900">
          {/* Center Content - Scrollable */}
          <div className="flex-1 flex flex-col">
            {/* Top Bar - Fixed */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="max-w-2xl mx-auto p-6">
                {activeTab === "feed" && (
                  <div className="space-y-4">
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
                          <CardContent className="p-4">
                            {/* Post Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={p.creator.avatar} alt={p.creator.name} />
                                  <AvatarFallback className="bg-orange-500 text-white text-sm">
                                    {p.creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {translateContent(p.creator.name, 'name')}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    @{p.creator.handle} • {p.time}
                                  </p>
                                </div>
                              </div>
                              {p.isPaid && (
                                <Badge className="bg-orange-500 text-white text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  {p.price}
                                </Badge>
                              )}
                            </div>

                            {/* Post Content */}
                            <div className="mb-3">
                              <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                                {translateContent(p.content, 'post')}
                              </p>
                              {p.image && (
                                <div className="relative">
                                  {p.isPaid && !p.isUnlocked ? (
                                    <div className="relative">
                                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                          <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">Paid Content</p>
                                          <Button 
                                            onClick={() => handleUnlock(p.id)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                                            size="sm"
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
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Post Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => handleLikeToggle(p.id)}
                                  className={`flex items-center space-x-1 text-xs transition-colors ${
                                    likedPosts.has(p.id) || p.isLiked 
                                      ? "text-red-500" 
                                      : "text-gray-500 hover:text-red-500"
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${likedPosts.has(p.id) || p.isLiked ? "fill-current" : ""}`} />
                                  <span>{p.likes}</span>
                                </button>
                                
                                <button
                                  onClick={() => toggleComments(p.id)}
                                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>
                                    {visibleComments.has(p.id) ? "Hide" : "Show"} ({commentCount[p.id] || p.comments})
                                  </span>
                                </button>

                                <button
                                  onClick={() => handleShare(p.id)}
                                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-500 transition-colors"
                                >
                                  <Share className="w-3 h-3" />
                                  <span>Share</span>
                                </button>
                              </div>

                              <Button
                                onClick={() => handleTip(p.id, p.creator.id)}
                                size="sm"
                                className={`text-xs ${
                                  tipAmounts[p.id] 
                                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                }`}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                {tipAmounts[p.id] 
                                  ? `${language === 'hi' ? 'टिप किया' : 'Tipped'} ₹${tipAmounts[p.id]}` 
                                  : (language === 'hi' ? 'टिप' : 'Tip')
                                }
                              </Button>
                            </div>

                            {/* Comments Section */}
                            {visibleComments.has(p.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-2 mb-3">
                                  {comments[p.id]?.map((comment) => (
                                    <div key={comment.id} className="flex space-x-2">
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage src={comment.user?.profile?.avatarUrl || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {comment.user?.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                            {comment.user?.name || 'Unknown User'}
                                          </p>
                                          <p className="text-xs text-gray-700 dark:text-gray-300">
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
                                    className="flex-1 text-xs"
                                  />
                                  <Button
                                    onClick={() => handleCommentSubmit(p.id)}
                                    disabled={submittingComments.has(p.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                                    size="sm"
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
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {language === 'hi' ? 'टॉप क्रिएटर्स' : 'Top Creators'}
                      </h2>
                      <Input
                        placeholder={language === 'hi' ? 'क्रिएटर्स खोजें...' : 'Search creators...'}
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
                    ) : filteredCreators.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Creators Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {creatorSearchTerm ? 'No creators match your search.' : 'No creators available at the moment.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {filteredCreators.map((creator) => (
                          <Card key={creator.id} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src={creator.avatar} alt={creator.name} />
                                  <AvatarFallback className="bg-orange-500 text-white text-lg font-semibold">
                                    {creator.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="w-full">
                                  <button
                                    onClick={() => handleCreatorClick(creator.id)}
                                    className="text-center hover:underline cursor-pointer group w-full"
                                  >
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base group-hover:text-orange-500 transition-colors truncate">
                                      {translateContent(creator.name, 'name')}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-orange-400 transition-colors truncate">
                                      @{creator.handle}
                                    </p>
                                  </button>
                                  
                                  <div className="flex flex-col space-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-medium">{creator.subscriberCount} subscribers</span>
                                    <span className="font-medium">{creator.postCount} posts</span>
                                  </div>
                                  
                                  <Button
                                    onClick={() => handleCreatorClick(creator.id)}
                                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                                  >
                                    {creator.subscribed ? "Subscribed" : "Subscribe"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "live-creators" && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {language === 'hi' ? 'लाइव क्रिएटर्स' : 'Live Creators'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'hi' ? 'अभी लाइव स्ट्रीमिंग कर रहे क्रिएटर्स को देखें' : 'Discover amazing creators who are streaming live right now'}
                      </p>
                    </div>
                    
                    {loadingLiveCreators ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading live creators...</p>
                      </div>
                    ) : liveCreators.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Live Creators</h3>
                        <p className="text-gray-500 dark:text-gray-400">No creators are currently live streaming.</p>
                      </div>
                    ) : (
                      <div className={`grid gap-4 ${
                        liveCreators.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                        liveCreators.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                        liveCreators.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto' :
                        liveCreators.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto' :
                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto'
                      }`}>
                        {liveCreators.map((creator) => (
                          <Card key={creator.id} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-3">
                                <div className="relative">
                                  <Avatar className="w-14 h-14">
                                    <AvatarImage src={creator.avatar} alt={creator.name} />
                                    <AvatarFallback className="bg-orange-500 text-white text-base font-semibold">
                                      {creator.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-gray-800"></div>
                                </div>
                                
                                <div className="w-full">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                                    {translateContent(creator.name, 'name')}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    @{creator.handle}
                                  </p>
                                  <div className="flex items-center justify-center space-x-1 mb-3">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <p className="text-xs text-red-500 font-medium">Live Now</p>
                                  </div>
                                  
                                  <Button
                                    onClick={() => handleLiveCreatorClick(creator.id)}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors duration-200"
                                  >
                                    Watch Live
                                  </Button>
                                </div>
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
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {language === 'hi' ? 'मेरी सदस्यताएं' : 'My Subscriptions'}
                      </h2>
                      
                      {/* Subscription Type Toggle */}
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                          onClick={() => setSubscriptionFilter('paid')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            subscriptionFilter === 'paid'
                              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{language === 'hi' ? 'पेड' : 'Paid'}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setSubscriptionFilter('trial')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            subscriptionFilter === 'trial'
                              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{language === 'hi' ? 'फ्री ट्रायल' : 'Free Trial'}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setSubscriptionFilter('cancelled')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            subscriptionFilter === 'cancelled'
                              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>{language === 'hi' ? 'रद्द' : 'Cancelled'}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {loadingSubscriptions ? (
                      <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">Loading subscriptions...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptionFilter === 'paid' && (
                          <>
                            {subscriptions.filter(sub => sub.type === 'paid').length > 0 ? (
                              <div className="grid gap-4">
                                {subscriptions.filter(sub => sub.type === 'paid').map((subscription) => (
                                  <Card key={subscription.id} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          <Avatar className="w-12 h-12 bg-green-500">
                                            <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.name} />
                                            <AvatarFallback className="bg-green-500 text-white">
                                              {subscription.creator.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h3>
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                              Paid Subscription
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                              Expires on: {subscription.expiresAt}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleCancelSubscription(subscription.id, subscription.type)}
                                          variant="outline"
                                          className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <CreditCard className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {language === 'hi' ? 'कोई पेड सदस्यता नहीं' : 'No paid subscriptions'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {language === 'hi' ? 'आपने अभी तक किसी भी क्रिएटर की पेड सदस्यता नहीं ली है।' : 'You haven\'t subscribed to any paid creators yet.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {subscriptionFilter === 'trial' && (
                          <>
                            {subscriptions.filter(sub => sub.type === 'trial').length > 0 ? (
                              <div className="grid gap-4">
                                {subscriptions.filter(sub => sub.type === 'trial').map((subscription) => (
                                  <Card key={subscription.id} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          <Avatar className="w-12 h-12 bg-blue-500">
                                            <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.name} />
                                            <AvatarFallback className="bg-blue-500 text-white">
                                              {subscription.creator.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h3>
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                              Free Trial
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                              Expires on: {subscription.expiresAt}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleRenewSubscription(subscription.id, subscription.creator.id)}
                                          className="bg-blue-500 hover:bg-blue-600 text-white"
                                        >
                                          {language === 'hi' ? 'नवीनीकरण' : 'Renew'}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <Clock className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {language === 'hi' ? 'कोई फ्री ट्रायल नहीं' : 'No free trials'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {language === 'hi' ? 'आपके पास कोई सक्रिय फ्री ट्रायल नहीं है।' : 'You don\'t have any active free trials.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {subscriptionFilter === 'cancelled' && (
                          <>
                            {subscriptions.filter(sub => sub.status === 'cancelled' || sub.isCancelled).length > 0 ? (
                              <div className="grid gap-4">
                                {subscriptions.filter(sub => sub.status === 'cancelled' || sub.isCancelled).map((subscription) => (
                                  <Card key={subscription.id} className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 opacity-75">
                                    <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          <Avatar className="w-12 h-12 bg-red-500">
                                            <AvatarImage src={subscription.creator.avatar} alt={subscription.creator.name} />
                                            <AvatarFallback className="bg-red-500 text-white">
                                              {subscription.creator.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                              {translateContent(subscription.creator.name, 'name')}
                                            </h3>
                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                              Cancelled
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                              Expired on: {subscription.expiresAt}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() => handleRenewSubscription(subscription.id, subscription.creator.id)}
                                          className="bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                          {language === 'hi' ? 'पुनः सदस्यता' : 'Resubscribe'}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <XCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {language === 'hi' ? 'कोई रद्द की गई सदस्यता नहीं' : 'No cancelled subscriptions'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {language === 'hi' ? 'आपके पास कोई रद्द की गई सदस्यता नहीं है।' : 'You don\'t have any cancelled subscriptions.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}
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
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                      <div className="bg-blue-600 text-white p-4">
                        <h3 className="text-xl font-bold">Direct Messages</h3>
                        <p className="text-blue-100 text-sm">Chat with creators or users in real-time</p>
                      </div>
                      
                      {/* Search Section */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
                          <div className="relative">
                            <input 
                              value={searchQuery} 
                              onChange={handleSearchChange}
                              placeholder="Search by name or email..." 
                              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                          
                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                              {searchResults.map((result) => (
                                <div 
                                  key={result.id}
                                  onClick={() => {
                                    console.log("Clicked on user:", result);
                                    startChatWithUser(result);
                                  }}
                                  className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors active:bg-blue-100 dark:active:bg-blue-900/40"
                                  style={{ userSelect: 'none' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 dark:text-gray-100">{result.name}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{result.email}</div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs ml-2">
                                      {result.role}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Manual User ID Entry */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start New Chat (User ID)</label>
                          <div className="flex gap-2">
                            <input 
                              value={newChatUserId} 
                              onChange={(e) => setNewChatUserId(e.target.value)} 
                              placeholder="Enter user ID to chat with" 
                              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                            <Button 
                              onClick={createNewChat} 
                              disabled={!newChatUserId} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start Chat
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                          Hey <span className="font-semibold">{user?.name}</span>! Ready to chat?
                        </div>
                      </div>

                      {/* Chat Tabs */}
                      {dmTabs.length > 0 && (
                        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          <div className="flex overflow-x-auto">
                            {dmTabs.map(tab => (
                              <div key={tab.id} className={`flex-shrink-0 border-b-2 ${activeDmTabId===tab.id?'border-blue-500 bg-white dark:bg-gray-900':'border-transparent'}`}>
                                <div className="flex items-center">
                                  <button onClick={()=>{setActiveDmTabId(tab.id); setDmTabs(p=>p.map(t=>t.id===tab.id?{...t, unreadCount:0}:t));}} className={`px-4 py-2 text-sm font-medium ${activeDmTabId===tab.id?'text-blue-600':'text-gray-600 dark:text-gray-300 hover:text-gray-800'}`}>
                                    <div className="flex items-center gap-2">
                                      <span>{tab.targetUserName || tab.targetUserId}</span>
                                      {tab.unreadCount>0 && (<span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">{tab.unreadCount}</span>)}
                                    </div>
                                  </button>
                                  <button onClick={()=>{setDmTabs(p=>p.filter(t=>t.id!==tab.id)); if(activeDmTabId===tab.id){ const remaining=dmTabs.filter(t=>t.id!==tab.id); setActiveDmTabId(remaining[0]?.id||null);} }} className="px-2 py-2 text-gray-400 hover:text-gray-600">×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      <div className="h-96 overflow-y-auto p-4 bg-white dark:bg-gray-900 space-y-3">
                        {dmTabs.length===0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                              <div className="text-6xl mb-4">💬</div>
                              <p className="text-lg font-medium">No active chats</p>
                              <p className="text-sm mt-2">Search for users to start chatting</p>
                            </div>
                          </div>
                        ) : !activeDmTab ? (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                              <div className="text-6xl mb-4">💬</div>
                              <p className="text-lg font-medium">Select a chat to start messaging</p>
                              <p className="text-sm mt-2">Click on a chat tab above to begin a conversation</p>
                            </div>
                          </div>
                        ) : (
                          activeDmTab.messages.map(m => (
                            <div key={m.id} className={`flex ${m.senderId===user?.id?'justify-end':'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${m.senderId==='system'?'bg-gray-200 text-gray-700 text-center italic':(m.senderId===user?.id?'bg-blue-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100')}`}>
                                {m.senderId!=='system' && m.senderId!==user?.id && (
                                  <div className="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">
                                    {m.senderName}
                                  </div>
                                )}
                                <div className="break-words">{m.text}</div>
                                <div className="text-xs opacity-75 mt-1">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      {activeDmTab && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                          <div className="flex gap-2">
                            <Input 
                              value={messageInput} 
                              onChange={(e) => setMessageInput(e.target.value)} 
                              onKeyPress={handleDmKey} 
                              placeholder={`Type a message to ${activeDmTab.targetUserName || activeDmTab.targetUserId}...`} 
                              className="flex-1" 
                            />
                            <Button 
                              onClick={sendDm} 
                              disabled={!messageInput.trim()} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Send
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    {/* Profile Information Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Header with gradient */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                        <div className="flex items-center">
                          <User className="w-6 h-6 text-white mr-3" />
                          <div>
                            <h2 className="text-xl font-bold text-white">Profile Information</h2>
                            <p className="text-blue-100 text-sm mt-1">Update your personal information and profile photo</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        {/* Profile Photo Section */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div 
                              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer border-4 border-gray-200 dark:border-gray-700 hover:border-orange-300 transition-colors"
                              onClick={() => setShowPhotoModal(true)}
                            >
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt="Profile preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : userData.avatarUrl ? (
                                <img
                                  src={userData.avatarUrl}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                  <User className="w-12 h-12 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 flex gap-2">
                              <button
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Photo</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF. Max size 5MB.</p>
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-500" />
                              Full Name
                            </label>
                            <Input
                              value={userData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-500" />
                              Email Address
                            </label>
                            <Input
                              value={userData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="Enter your email"
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Save Changes Button */}
                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Account Information Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-blue-600 p-4">
                        <h2 className="text-lg font-medium text-white flex items-center">
                          <Lock className="w-5 h-5 mr-2" />
                          Account Information
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                              <span className="text-gray-500 mr-2">#</span>
                              User ID
                            </label>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                              {(session?.user as any)?.id || "N/A"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Member Since
                            </label>
                            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 text-sm text-blue-600 dark:text-blue-300">
                              {(session?.user as any)?.createdAt ? new Date((session?.user as any).createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) : "N/A"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Account Type
                            </label>
                            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3 text-sm text-green-600 dark:text-green-300 font-medium">
                              {(session?.user as any)?.role || "CONSUMER"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Top Creators - Fixed */}
          {activeTab === "feed" && (
            <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center space-x-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {language === 'hi' ? 'टॉप क्रिएटर्स' : 'Top Creators'}
                  </h2>
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto">
                  {creators.slice(0, 4).map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback className="bg-orange-500 text-white">
                            {creator.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <button
                            onClick={() => router.push(`/creator/${creator.id}`)}
                            className="text-left hover:underline cursor-pointer"
                          >
                            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-orange-500 transition-colors">
                              {translateContent(creator.name, 'name')}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{creator.handle}
                            </p>
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCreatorClick(creator.id)}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                      >
                        {language === 'hi' ? 'फॉलो करें' : 'Follow'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" style={{zIndex: 9999}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {language === 'hi' ? 'टिप भेजें' : 'Send Tip'}
              </h3>
              <button
                onClick={() => {
                  setShowTipModal(false);
                  setCurrentTipPost(null);
                  setTipInput('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'hi' ? 'टिप की राशि (₹)' : 'Tip Amount (₹)'}
              </label>
              <Input
                type="number"
                placeholder={language === 'hi' ? 'राशि दर्ज करें' : 'Enter amount'}
                value={tipInput}
                onChange={(e) => setTipInput(e.target.value)}
                className="w-full"
                min="1"
                step="1"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setTipInput('10')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                ₹10
              </Button>
              <Button
                onClick={() => setTipInput('50')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                ₹50
              </Button>
              <Button
                onClick={() => setTipInput('100')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                ₹100
              </Button>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <Button
                onClick={() => {
                  setShowTipModal(false);
                  setCurrentTipPost(null);
                  setTipInput('');
                }}
                variant="outline"
                className="flex-1"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button
                onClick={handleTipSubmit}
                disabled={submittingTip || !tipInput.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submittingTip 
                  ? (language === 'hi' ? 'भेज रहे हैं...' : 'Sending...') 
                  : (language === 'hi' ? 'टिप भेजें' : 'Send Tip')
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* Photo Management Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Photo</h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : userData.avatarUrl ? (
                  <img
                    src={userData.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  document.getElementById('avatar-upload')?.click();
                  setShowPhotoModal(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
                Update Photo
              </button>
              {userData.avatarUrl && (
                <button
                  onClick={() => {
                    setUserData(prev => ({ ...prev, avatarUrl: null }));
                    setPreviewUrl(null);
                    setAvatarFile(null);
                    setShowPhotoModal(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
