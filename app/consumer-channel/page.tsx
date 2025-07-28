"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  Home,
  Store,
  Package,
  CreditCard,
  MessageCircle,
  Settings,
  Lock,
  Star,
  TrendingUp,
  Heart,
  Share,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  Image as LucideImage,
  Code,
  Book,
  Video,
  Headphones,
  Grid3X3,
  Users,
  DollarSign,
  ArrowLeft,
  Gift,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewModal } from "@/components/ReviewModal";
import axios from "axios";
import Image from "next/image";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "CREATOR" | "CONSUMER" | "ADMIN";
}

interface TopCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  subscriberCount: number;
  subscribed: boolean;
  IsLive?: boolean;
}

interface Post {
  id: string;
  creator: {
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
  tips?: {
    count: number;
    totalAmount: number;
    recent: {
      id: string;
      user: {
        id: string;
        name: string;
        avatar: string;
      };
      amount: number;
      createdAt: string;
    }[];
  };
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  type:
    | "image"
    | "video"
    | "course"
    | "template"
    | "software"
    | "ebook"
    | "audio"
    | "physical";
  creator: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  thumbnail: string;
  rating: number;
  sales: number;
  hasReview?: boolean;
  userReview?: {
    rating: number;
    comment?: string;
  } | null;
}

const TYPE_ICONS = {
  image: LucideImage,
  video: Video,
  course: Play,
  template: Grid3X3,
  software: Code,
  ebook: Book,
  audio: Headphones,
  physical: Package,
};

// Define Comment type
interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: {
    name?: string;
    profile?: { avatarUrl?: string };
  };
}

export default function ConsumerChannelPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("feed");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [post, setpost] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  // Store state
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [storeActiveTab, setStoreActiveTab] = useState("top");
  const [creatorSearchTerm, setCreatorSearchTerm] = useState("");
  const [creatorCategory, setCreatorCategory] = useState("all");
  const [allCreator, setAllCreator] = useState<TopCreator[]>([]);
  const [liveCreators, setLiveCreators] = useState<TopCreator[]>([]);

  // Comments state
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{
    [postId: string]: string;
  }>({});
  const [loadingComments, setLoadingComments] = useState<{
    [postId: string]: boolean;
  }>({});
  const [submittingComment, setSubmittingComment] = useState<{
    [postId: string]: boolean;
  }>({});
  const [visibleComments, setVisibleComments] = useState<{
    [postId: string]: boolean;
  }>({});
  const [commentCount, setComentCount] = useState<{ [postId: string]: number }>(
    {}
  );

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  // My Products state
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingMyProducts, setLoadingMyProducts] = useState(true);
  const [myProductsError, setMyProductsError] = useState<string | null>(null);
  const [myProductsSearchTerm, setMyProductsSearchTerm] = useState("");
  const [selectedMyProductType, setSelectedMyProductType] = useState<string>("all");
  
  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<Product | null>(null);
  
  // Selected product for full-page view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null
  );

  // For API calls that require auth, use:
  const token = (session as Session & { accessToken?: string })?.accessToken;
  console.log("Token sent for authorization: ", token);

  // Tip modal state
  const [showTipModal, setShowTipModal] = useState<{ postId: string | null }>({
    postId: null,
  });
  const [tipInput, setTipInput] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState("");
  const [tipSuccess, setTipSuccess] = useState("");

  // Subscriptions state
  const [paidSubscriptions, setPaidSubscriptions] = useState<any[]>([]);
  const [trialSubscriptions, setTrialSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);

  // Toggle comments visibility for a post
  const toggleComments = (postId: string) => {
    setVisibleComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    // If opening, fetch comments
    if (!visibleComments[postId]) fetchComments(postId);
  };

  // Delete a comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const token = (session as Session & { accessToken?: string })
        ?.accessToken;
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      await axios.delete(`/api/posts/${postId}/comment`, {
        data: { commentId },
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchComments(postId);
    } catch (error) {
      console.log("Error in deleting the comments: ", error);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as SessionUser | undefined;
    if (!session || !user || user.role !== "CONSUMER") {
      router.replace("/login");
    }
  }, [session, status, router]);

  // Helper to check unlock status for a post
  const checkUnlockStatus = async (postId: string) => {
    try {
      const token = (session as Session & { accessToken?: string })?.accessToken;
      if (!token) return false;
      const res = await axios.post(
        "/api/payment/check-unlock-media",
        { postId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data && res.data.unlocked;
    } catch {
      return false;
    }
  };

  // After fetching posts, check unlock status for each paid post
  const fetchAndSetPosts = async () => {
    try {
      // Using cookie-based authentication (NextAuth session cookies)
      const res = await axios.get("/api/posts", {
        withCredentials: true,
      });
      if (res.status === 200) {
        const posts = res.data.posts;
        // For each paid post, check unlock status
        const updatedPosts = await Promise.all(
          posts.map(async (post: Post) => {
            if (post.isPaid) {
              const unlocked = await checkUnlockStatus(post.id);
              return { ...post, isUnlocked: unlocked };
            }
            return post;
          })
        );
        setpost(updatedPosts);
        // Initialize liked posts state
        const likedPostIds = updatedPosts
          .filter((post: Post) => post.isLiked)
          .map((post: Post) => post.id);
        setLikedPosts(new Set(likedPostIds));
      } else if (res.status === 500) {
        console.log("Error in fetching post with status code 500");
      }
    } catch (error) {
      console.log("Error in fetching post: ", error);
    }
  };

  // Replace fetchPost with fetchAndSetPosts everywhere
  useEffect(() => {
    fetchAndSetPosts();
  }, [session]);

  useEffect(() => {
    if (localStorage.getItem('refreshFeed')) {
      fetchAndSetPosts();
      localStorage.removeItem('refreshFeed');
    }
  }, []);

  // Fetch top creators
  useEffect(() => {
    const fetchTopCreators = async () => {
      try {
        const res = await axios.get("/api/creators");
        console.log("Response from fetching top creators: ", res);
        if (res.status === 200) {
          setTopCreators(res.data.creators);
        } else if (res.status === 500) {
          console.log(
            "Error in fetching top creators with status code 500: ",
            res
          );
        }
      } catch (error) {
        console.log("Error in fetching top creators: ", error);
      } finally {
        setLoadingCreators(false);
      }
    };

    fetchTopCreators();
  }, []);

  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.get(`/api/posts/${postId}/comment`, {
        withCredentials: true,
      });
      setComments((prev) => ({ ...prev, [postId]: res.data.comments }));
      setComentCount((prev) => ({
        ...prev,
        [postId]: res.data.comments.length || 0,
      }));
      console.log(
        "Comment count: ",
        res.data.comments.length,
        " with postid: ",
        postId
      );
    } catch (error) {
      setComments((prev) => ({ ...prev, [postId]: [] }));
      console.log("Error in fetching comments: ", error);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Handle comment input change
  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    console.log("Content for posting comment: ", content);
    if (!content) return;
    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(
        `/api/posts/${postId}/comment`,
        {
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response of posting comment: ", res);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      await fetchComments(postId);
    } catch (error) {
      console.log("Error in commentsubmit: ", error);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Fetch comments when posts load
  useEffect(() => {
    post.forEach((p) => {
      fetchComments(p.id);
    });
  }, [post.length]);

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/creator/${creatorId}`);
  };

  const handleLogout = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/",
    });
    // Force redirect to home page
    window.location.href = "/";
  };

  const handleLikeToggle = async (postId: string) => {
    try {
      const response = await axios.post(
        `/api/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const { action } = response.data;

        // Update liked posts state
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (action === "liked") {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        // Update post likes count
        setpost((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                likes: action === "liked" ? p.likes + 1 : p.likes - 1,
                isLiked: action === "liked",
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleTip = async (postId: string) => {
    setTipLoading(true);
    setTipError("");
    setTipSuccess("");
    try {
      const token = (session as Session & { accessToken?: string })
        ?.accessToken;
      const res = await axios.post(
        `/api/posts/${postId}/tip`,
        { tipAmount: Number(tipInput) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Tip response: ", res);
      setTipSuccess("Tip sent! 🎉");
      setTipInput("");
      setShowTipModal({ postId: null });
      
      // Refresh posts data to show the new tip
      fetchAndSetPosts();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setTipError(
          (err.response as { data: { message: string } }).data.message ||
            "Failed to send tip."
        );
      } else {
        setTipError("Failed to send tip.");
      }
    } finally {
      setTipLoading(false);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      
      const params = new URLSearchParams({
        search: storeSearchTerm,
        type: selectedType,
        page: '1',
        limit: '50',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      const response = await axios.get(`/api/products?${params}`);
      
      if (response.data.success) {
        // Ensure product types are always lowercase to match TYPE_ICONS keys
        const normalizedProducts = response.data.products.map((p: any) => ({
          ...p,
          type: typeof p.type === "string" ? p.type.toLowerCase() : p.type,
        }));
        setProducts(normalizedProducts);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 400) {
          setProductsError('Invalid search parameters. Please try again.');
        } else if (status === 404) {
          setProductsError('Products not found.');
        } else if (status >= 500) {
          setProductsError('Server error. Please try again later.');
        } else {
          setProductsError('Failed to load products. Please try again.');
        }
      } else if (error.request) {
        // Network error
        setProductsError('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        setProductsError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch my products
  const fetchMyProducts = async () => {
    try {
      setLoadingMyProducts(true);
      setMyProductsError(null);
      
      const params = new URLSearchParams({
        search: myProductsSearchTerm,
        type: selectedMyProductType,
        page: '1',
        limit: '50'
      });
      
      const response = await axios.get(`/api/my-products?${params}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setMyProducts(response.data.products);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching my products:', error);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          setMyProductsError('Please log in to view your products.');
        } else if (status === 400) {
          setMyProductsError('Invalid search parameters. Please try again.');
        } else if (status >= 500) {
          setMyProductsError('Server error. Please try again later.');
        } else {
          setMyProductsError('Failed to load your products. Please try again.');
        }
      } else if (error.request) {
        setMyProductsError('Network error. Please check your connection and try again.');
      } else {
        setMyProductsError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoadingMyProducts(false);
    }
  };

  // Fetch products on component mount and when filters change
  useEffect(() => {
    if (activeTab === 'store') {
      fetchProducts();
    }
  }, [activeTab, storeSearchTerm, selectedType]);

  // Fetch my products when tab changes
  useEffect(() => {
    if (activeTab === 'products') {
      fetchMyProducts();
    }
  }, [activeTab, myProductsSearchTerm, selectedMyProductType]);

  // Review handlers
  const handleReviewProduct = (product: Product) => {
    setSelectedProductForReview(product);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh the products list to show updated review status
    fetchMyProducts();
  };

  const handleReviewModalClose = () => {
    setReviewModalOpen(false);
    setSelectedProductForReview(null);
  };

  // Store filtering logic (now done on the server side)
  const filteredProducts = products;

  const fetchAllCreators = async () => {
    try {
      const res = await axios.get("/api/creators/all");
      console.log("Response of fetching all creators: ", res);
      setAllCreator(res.data.creators);
    } catch (error) {
      console.log("Error in fetching all creators: ", error);
    }
  };

  const fetchLiveCreators = async () => {
    try {
      const res = await axios.get("/api/creators/live");
      console.log("Live creators response: ", res);
      setLiveCreators(res.data.creators);
    } catch (error) {
      console.log("Error in fetching live creators: ", error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      setSubscriptionsError(null);
      
      console.log("🔍 [FRONTEND] Fetching subscriptions...");
      const res = await axios.get("/api/user/subscriptions", {
        withCredentials: true, // Use cookie-based auth
      });
      
      console.log("✅ [FRONTEND] Subscriptions response:", res.data);
      setPaidSubscriptions(res.data.paidSubscriptions || []);
      setTrialSubscriptions(res.data.trialSubscriptions || []);
    } catch (error: any) {
      console.error("❌ [FRONTEND] Error fetching subscriptions:", error);
      
      let errorMessage = "Failed to load subscriptions. Please try again.";
      if (error.response) {
        console.error("Response error:", error.response.data);
        if (error.response.status === 401) {
          errorMessage = "Please log in to view your subscriptions.";
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        console.error("Request error:", error.request);
        errorMessage = "Network error. Please check your connection.";
      }
      
      setSubscriptionsError(errorMessage);
      setPaidSubscriptions([]);
      setTrialSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    try {
      if (activeTab === "feed") {
        fetchAndSetPosts();
      }
      if (activeTab === "store") {
        fetchProducts();
      }
      if (activeTab === "products") {
        fetchMyProducts();
      }
      if (activeTab === "subscriptions") {
        fetchSubscriptions();
      }
      if (activeTab === "livecreators") {
        fetchLiveCreators();
      }
      if (activeTab === "creators") {
        fetchAllCreators();
      }
      if (activeTab === "chats") {
      }
      if (activeTab === "settings") {
      }
    } catch (error) {
      console.log("Error in useEffect change by active Tab: ", error);
    }
  }, [activeTab]);

  // Add refetch on tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        activeTab === "Live Creators"
      ) {
        fetchLiveCreators();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab]);

  // Store component
  const renderCreatorsContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          Discover Creators
        </h1>
        <p className="text-gray-400 text-lg">
          Find and follow amazing creators
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search creators..."
            value={creatorSearchTerm}
            onChange={(e) => setCreatorSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-2xl text-gray-100 placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        <select
          value={creatorCategory}
          onChange={(e) => setCreatorCategory(e.target.value)}
          className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-2xl text-gray-100 focus:outline-none focus:border-yellow-500/50"
        >
          <option value="all">All Categories</option>
          <option value="art">Art & Design</option>
          <option value="tech">Technology</option>
          <option value="music">Music</option>
          <option value="fitness">Fitness</option>
          <option value="education">Education</option>
        </select>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingCreators
          ? // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/40"
              >
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          : allCreator.map((creator) => (
              <Card
                key={creator.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/40 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 cursor-pointer group"
                onClick={() => handleCreatorClick(creator.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 ring-2 ring-yellow-400/50 group-hover:ring-yellow-400 transition-all duration-300">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback className="bg-gray-700 text-white text-xl">
                        {creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-100 group-hover:text-yellow-400 transition-colors">
                        {creator.name}
                      </h3>
                      <p className="text-gray-400 text-sm">@{creator.handle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-gray-300 text-sm">
                          {creator.subscriberCount} subscribers
                        </span>
                      </div>
                    </div>
                  </div>

                  {creator.bio && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {creator.subscribed ? (
                      <Badge className="bg-green-600/20 text-green-400 border border-green-500/30">
                        Subscribed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle follow action here
                        }}
                      >
                        Follow
                      </Button>
                    )}
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">Posts</div>
                      <div className="text-gray-200 font-semibold">24</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );

  // My Products component with horizontal cards
  const renderMyProductsContent = () => (
    <div className="space-y-6">
      {/* My Products Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-100">My Products</h2>
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
            {myProducts.length} Purchased
          </Badge>
        </div>

        <div className="flex items-center bg-gray-800/50 p-1 rounded-full space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search your products..."
              value={myProductsSearchTerm}
              onChange={(e) => setMyProductsSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-48 bg-transparent focus:outline-none text-gray-100 placeholder-gray-400 text-sm"
            />
          </div>

          {/* Type Selector */}
          <select
            value={selectedMyProductType}
            onChange={(e) => setSelectedMyProductType(e.target.value)}
            className="bg-gray-700/50 py-2 pl-4 pr-8 rounded-full text-sm focus:outline-none text-gray-100 border border-gray-600"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="course">Courses</option>
            <option value="template">Templates</option>
            <option value="software">Software</option>
            <option value="ebook">E-books</option>
            <option value="audio">Audio</option>
            <option value="physical">Physical</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loadingMyProducts && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-800/50 border-gray-700/40 animate-pulse">
              <div className="flex items-center p-4">
                <div className="w-20 h-20 bg-gray-700 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-6 bg-gray-700 rounded-full"></div>
                    <div className="h-4 w-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {myProductsError && !loadingMyProducts && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold mb-2 text-gray-400">
            {myProductsError}
          </h3>
          <p className="text-gray-500 mb-6">
            We couldn't load your products. Please check your connection and try again.
          </p>
          <button
            onClick={fetchMyProducts}
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loadingMyProducts && !myProductsError && myProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold mb-2 text-gray-400">
            No products purchased yet
          </h3>
          <p className="text-gray-500 mb-6">
            {myProductsSearchTerm || selectedMyProductType !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Start exploring the product store to find amazing content!'
            }
          </p>
          {(myProductsSearchTerm || selectedMyProductType !== 'all') && (
            <button
              onClick={() => {
                setMyProductsSearchTerm('');
                setSelectedMyProductType('all');
              }}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium mr-4"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => setActiveTab('store')}
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            Browse Store
          </button>
        </div>
      )}

      {/* My Products List - Horizontal Cards */}
      {!loadingMyProducts && !myProductsError && myProducts.length > 0 && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="text-sm text-gray-400">
            Showing {myProducts.length} purchased product{myProducts.length !== 1 ? 's' : ''}
            {(myProductsSearchTerm || selectedMyProductType !== 'all') && (
              <span> for your search</span>
            )}
          </div>
          
          <div className="space-y-3 max-w-6xl mx-auto">
            {myProducts.map((product: Product) => {
              const IconComponent = TYPE_ICONS[product.type as keyof typeof TYPE_ICONS];
              return (
                <Card
                  key={product.id}
                  className="group cursor-pointer bg-gray-800/50 border-gray-700/40 hover:bg-gray-700/40 transition-all duration-200 hover:shadow-lg w-full"
                >
                  <div className="flex items-center p-6">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 mr-6 flex-shrink-0">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/96x96/374151/9CA3AF?text=Product';
                        }}
                      />
                      
                      {/* Type indicator */}
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-black/60 rounded-full p-1">
                          <IconComponent className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-100 text-base truncate">
                            {product.title}
                          </h3>
                          {product.description && (
                            <p className="text-gray-400 text-sm line-clamp-1 mt-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage
                              src={product.creator.avatar}
                              alt={product.creator.name}
                            />
                            <AvatarFallback className="bg-gray-700 text-white text-xs">
                              {product.creator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-300 truncate">
                            {product.creator.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300">{product.rating}</span>
                          </div>
                          {product.hasReview && product.userReview && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-yellow-400 font-medium">You rated it {product.userReview.rating} star{product.userReview.rating !== 1 ? 's' : ''}!</span>
                            </div>
                          )}
                          <div className="text-gray-400 text-sm">
                            ₹{product.price}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 ml-6">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download/view action
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={product.hasReview 
                          ? "border-yellow-600 text-yellow-400 hover:bg-yellow-600/20" 
                          : "border-green-600 text-green-400 hover:bg-green-600/20"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewProduct(product);
                        }}
                      >
                        {product.hasReview ? "View Review" : "Review"}
                      </Button>

                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedProductForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={handleReviewModalClose}
          productId={selectedProductForReview.id}
          productTitle={selectedProductForReview.title}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );

  const renderStoreContent = () => (
    <div className="space-y-6">
      {/* Detail view */}
      {selectedProduct && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-300 hover:text-white"
            onClick={() => setSelectedProduct(null)}
          >
            <ChevronLeft className="w-4 h-4" /> Back to products
          </Button>

          <Card className="bg-gray-800/70 border-gray-700/40 max-w-4xl mx-auto">
            <div className="relative h-96 w-full overflow-hidden rounded-t-lg">
              <img
                src={selectedProduct.thumbnail}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src =
                    "https://via.placeholder.com/800x600/374151/9CA3AF?text=Product+Image";
                }}
              />
            </div>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-3xl font-bold text-gray-100">
                {selectedProduct.title}
              </h2>
              {selectedProduct.description && (
                <p className="text-gray-300 max-w-prose">
                  {selectedProduct.description}
                </p>
              )}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Avatar 
                    className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-yellow-400/50 transition-all duration-200"
                    onClick={() => handleCreatorClick(selectedProduct.creator.id)}
                  >
                    <AvatarImage
                      src={selectedProduct.creator.avatar}
                      alt={selectedProduct.creator.name}
                    />
                    <AvatarFallback>{selectedProduct.creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <span 
                    className="cursor-pointer hover:text-yellow-400 transition-colors"
                    onClick={() => handleCreatorClick(selectedProduct.creator.id)}
                  >
                    {selectedProduct.creator.name}
                  </span>
                </div>
                <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full">
                  ₹{selectedProduct.price}
                </span>
              </div>

              {/* Buy Now Button for Selected Product */}
              <div className="flex justify-center">
                <button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]"
                  disabled
                  onClick={() => {
                    // TODO: Implement buy functionality
                  }}
                >
                  Buy Now - ₹{selectedProduct.price}
                </button>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-gray-400 text-sm">Payment functionality coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Standard grid view – hidden when a product is selected */}
      {!selectedProduct && (
        <>
          {/* Store Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-100">Product Store</h2>
              <nav className="flex items-center space-x-2 bg-gray-800/50 p-1 rounded-full">
                <button
                  onClick={() => setStoreActiveTab("top")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    storeActiveTab === "top"
                      ? "bg-yellow-500 text-black shadow-sm"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Top Products</span>
                </button>
                <button
                  onClick={() => setStoreActiveTab("following")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    storeActiveTab === "following"
                      ? "bg-yellow-500 text-black shadow-sm"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                </button>
              </nav>
            </div>

            <div className="flex items-center bg-gray-800/50 p-1 rounded-full space-x-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={storeSearchTerm}
                  onChange={(e) => setStoreSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-48 bg-transparent focus:outline-none text-gray-100 placeholder-gray-400 text-sm"
                />
              </div>

              {/* Type Selector */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-gray-700/50 py-2 pl-4 pr-8 rounded-full text-sm focus:outline-none text-gray-100 border border-gray-600"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="course">Courses</option>
                <option value="template">Templates</option>
                <option value="software">Software</option>
                <option value="ebook">E-books</option>
                <option value="audio">Audio</option>
                <option value="physical">Physical</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loadingProducts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gray-800/50 border-gray-700/40 animate-pulse">
                  <div className="h-48 bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded mb-2"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-6 bg-gray-700 rounded-full"></div>
                      <div className="h-4 w-8 bg-gray-700 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {productsError && !loadingProducts && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-400">
                {productsError}
              </h3>
              <p className="text-gray-500 mb-6">
                We couldn't load the products. Please check your connection and try again.
              </p>
              <button
                onClick={fetchProducts}
                className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingProducts && !productsError && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-400">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                {storeSearchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'No products are available at the moment.'
                }
              </p>
              {(storeSearchTerm || selectedType !== 'all') && (
                <button
                  onClick={() => {
                    setStoreSearchTerm('');
                    setSelectedType('all');
                  }}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!loadingProducts && !productsError && filteredProducts.length > 0 && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="text-sm text-gray-400">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                {(storeSearchTerm || selectedType !== 'all') && (
                  <span> for your search</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: Product) => {
                  const IconComponent =
                    TYPE_ICONS[
                      (product.type as string).toLowerCase() as keyof typeof TYPE_ICONS
                    ] || LucideImage;
                  return (
                    <Card
                      key={product.id}
                      className="group cursor-pointer bg-gray-800/50 border-gray-700/40 hover:bg-gray-700/40 transition-all duration-200 hover:shadow-lg"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative">
                        {/* Product Image */}
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/400x300/374151/9CA3AF?text=Product+Image';
                            }}
                          />

                          {/* Type indicator */}
                          <div className="absolute top-2 right-2">
                            <div className="bg-black/60 rounded-full p-1.5">
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* Video play indicator */}
                          {product.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/60 rounded-full p-3">
                                <Play className="h-6 w-6 text-white fill-current" />
                              </div>
                            </div>
                          )}

                          {/* Price overlay */}
                          <div className="absolute top-2 left-2">
                            <div className="bg-yellow-500 text-black font-bold px-2 py-1 rounded-full text-sm">
                              ₹{product.price}
                            </div>
                          </div>

                          {/* Sales badge */}
                          {product.sales > 100 && (
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-green-500 text-white text-xs">
                                {product.sales}+ sold
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-100 text-base line-clamp-2 flex-1 mr-2">
                              {product.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center space-x-2">
                              <Avatar 
                                className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-yellow-400/50 transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreatorClick(product.creator.id);
                                }}
                              >
                                <AvatarImage
                                  src={product.creator.avatar}
                                  alt={product.creator.name}
                                />
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                  {product.creator.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span 
                                className="text-gray-300 truncate cursor-pointer hover:text-yellow-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreatorClick(product.creator.id);
                                }}
                              >
                                {product.creator.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-gray-300">{product.rating}</span>
                            </div>
                          </div>

                          {/* Product description */}
                          {product.description && (
                            <p className="text-gray-400 text-xs line-clamp-2 mb-3">
                              {product.description}
                            </p>
                          )}

                          {/* Price and Buy Now Button */}
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-2xl font-bold text-white">
                              ₹{product.price}
                            </span>
                            <button 
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              disabled
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement buy functionality
                              }}
                            >
                              Buy Now
                            </button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLiveCreatorsContent = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          Live Creators
        </h1>
        <p className="text-gray-400 text-lg">
          Join a livestream from any creator
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveCreators.map((creator) => (
          <Card
            key={creator.id}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/40 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 cursor-pointer group"
            onClick={() => router.push(`/livestream/${creator.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16 ring-2 ring-yellow-400/50 group-hover:ring-yellow-400 transition-all duration-300">
                  <AvatarImage src={creator.avatar} alt={creator.name} />
                  <AvatarFallback className="bg-gray-700 text-white text-xl">
                    {creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-yellow-400 transition-colors">
                    {creator.name}
                  </h3>
                  <p className="text-gray-400 text-sm">@{creator.handle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
              {creator.bio && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {creator.bio}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubscriptionsContent = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          Manage Subscriptions
        </h1>
        <p className="text-gray-400 text-lg">
          Your active subscriptions and free trials
        </p>
      </div>

      {loadingSubscriptions ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="ml-2 text-gray-600">Loading subscriptions...</span>
        </div>
      ) : subscriptionsError ? (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{subscriptionsError}</p>
          <Button 
            onClick={fetchSubscriptions}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paid Subscriptions Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-blue-400">
                Paid Subscriptions
              </h2>
              <span className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-full">
                {paidSubscriptions.length}
              </span>
            </div>

            {paidSubscriptions.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/40 p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No paid subscriptions</p>
                <p className="text-gray-500 text-sm">
                  Subscribe to creators to see them here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {paidSubscriptions.map((subscription) => (
                  <Card 
                    key={subscription.id} 
                    className="bg-gradient-to-br from-blue-900/20 to-blue-800/30 border border-blue-700/40 hover:from-blue-800/30 hover:to-blue-700/40 transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-blue-400/50">
                            <AvatarImage
                              src={subscription.creator.avatar}
                              alt={subscription.creator.name}
                            />
                            <AvatarFallback className="bg-blue-700 text-white">
                              {subscription.creator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-blue-200 text-lg">
                              {subscription.creator.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Subscribed since {new Date(subscription.startedAt).toLocaleDateString()}
                            </p>
                            {subscription.isFromTrial && (
                              <p className="text-yellow-400 text-xs">
                                Converted from trial
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full">
                            ✓ Active
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Free Trials Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-green-400">
                Free Trials
              </h2>
              <span className="bg-green-500/20 text-green-300 text-sm px-3 py-1 rounded-full">
                {trialSubscriptions.filter(t => t.status === 'active').length}
              </span>
            </div>

            {trialSubscriptions.filter(t => t.status === 'active').length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/40 p-8 text-center">
                <Gift className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No active trials</p>
                <p className="text-gray-500 text-sm">
                  Start a free trial to see it here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {trialSubscriptions.filter(t => t.status === 'active').map((trial) => (
                  <Card 
                    key={trial.id} 
                    className="bg-gradient-to-br from-green-900/20 to-green-800/30 border border-green-700/40"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-green-400/50">
                            <AvatarImage
                              src={trial.creator.avatar}
                              alt={trial.creator.name}
                            />
                            <AvatarFallback className="bg-green-700 text-white">
                              {trial.creator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-green-200 text-lg">
                              {trial.creator.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Started {new Date(trial.startedAt).toLocaleDateString()}
                            </p>
                            {trial.isNaturallyExpired ? (
                              <p className="text-yellow-400 text-xs">
                                Trial expired - Auto-pay active
                              </p>
                            ) : (
                              <p className="text-green-400 text-xs">
                                {trial.remainingTime} remaining
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm px-3 py-1 rounded-full ${
                            trial.status === 'active' 
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {trial.status === 'active' ? '🎁 Active' : (trial.isCancelled ? '❌ Cancelled' : '❌ Expired')}
                          </div>
                          {trial.status === 'active' && !trial.isNaturallyExpired && (
                            <Button
                              onClick={async () => {
                                try {
                                  console.log('🔍 [CANCEL-AUTO-PAY] Starting cancellation for trial:', trial.id);
                                  console.log('🔍 [CANCEL-AUTO-PAY] Creator ID:', trial.creatorId);
                                  
                                  const response = await fetch('/api/subscribe/cancel-auto-pay', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      creatorId: trial.creatorId,
                                      trialId: trial.id 
                                    })
                                  });
                                  
                                  console.log('📨 [CANCEL-AUTO-PAY] Response status:', response.status);
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    console.log('✅ [CANCEL-AUTO-PAY] Success response:', data);
                                    alert('Auto-pay cancelled successfully!');
                                    // Small delay to ensure database update is complete
                                    setTimeout(() => {
                                      fetchSubscriptions();
                                    }, 500);
                                  } else {
                                    const errorData = await response.json();
                                    console.error('❌ [CANCEL-AUTO-PAY] Failed response:', errorData);
                                    alert(`Failed to cancel auto-pay: ${errorData.error || 'Unknown error'}`);
                                  }
                                } catch (error) {
                                  console.error('❌ [CANCEL-AUTO-PAY] Network error:', error);
                                  alert('Network error. Please try again.');
                                }
                              }}
                              className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                            >
                              Cancel Auto-pay
                            </Button>
                          )}
                          {trial.status === 'expired' && (
                            <p className="text-gray-400 text-xs mt-1">
                              {trial.isCancelled ? 'Cancelled' : 'Expired'} {new Date(trial.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cancelled Subscriptions / Payment Failed Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-red-400">
                Cancelled/Failed
              </h2>
              <span className="bg-red-500/20 text-red-300 text-sm px-3 py-1 rounded-full">
                {trialSubscriptions.filter(t => t.status === 'expired' && t.isCancelled).length}
              </span>
            </div>

            {trialSubscriptions.filter(t => t.status === 'expired' && t.isCancelled).length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/40 p-8 text-center">
                <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No cancelled subscriptions</p>
                <p className="text-gray-500 text-sm">
                  Manually cancelled trials appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {trialSubscriptions.filter(t => t.status === 'expired' && t.isCancelled).map((trial) => (
                  <Card 
                    key={trial.id} 
                    className="bg-gradient-to-br from-red-900/20 to-red-800/30 border border-red-700/40"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-red-400/50">
                            <AvatarImage
                              src={trial.creator.avatar}
                              alt={trial.creator.name}
                            />
                            <AvatarFallback className="bg-red-700 text-white">
                              {trial.creator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-red-200 text-lg">
                              {trial.creator.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Started {new Date(trial.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-red-500/20 text-red-300 text-sm px-3 py-1 rounded-full">
                            ❌ Cancelled
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            Cancelled {new Date(trial.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-lg text-purple-100">Loading...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as SessionUser | undefined;
  if (!session || !user || user.role !== "CONSUMER") {
    return null;
  }

  const navItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "store", label: "Product Store", icon: Store },
    { id: "products", label: "My Products", icon: Package },
    { id: "subscriptions", label: "Manage Subscriptions", icon: CreditCard },
    { id: "livecreators", label: "Live Creators", icon: Users },
    { id: "creators", label: "Creators", icon: Users },
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-50 flex">
      {/* Sidebar - Fixed and Scrollable */}
      <aside
        className={`fixed left-0 top-0 h-screen ${
          sidebarCollapsed ? "w-16" : "w-80"
        } md:w-16 lg:${
          sidebarCollapsed ? "w-16" : "w-80"
        } bg-gradient-to-b from-gray-900/95 via-black/90 to-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col p-6 space-y-6 overflow-y-auto z-10 transition-all duration-300`}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between mb-4">
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:from-yellow-600 hover:to-orange-600 rounded-lg flex items-center justify-center transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✧</span>
                </div>
                <span className="text-2xl font-bold text-gray-100 md:hidden lg:inline tracking-wide">
                  FanFeed
                </span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 ${
                sidebarCollapsed ? "px-2 justify-center" : "px-6"
              } md:px-2 md:justify-center lg:${
                sidebarCollapsed ? "px-2 justify-center" : "px-6 justify-start"
              } py-4 rounded-2xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white shadow-lg backdrop-blur-sm"
                  : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium md:hidden lg:inline">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Greeting & Logout */}
        <div className="space-y-3">
          {!sidebarCollapsed && (
            <div className="text-center py-2">
              <p className="text-gray-300 text-sm font-medium">
                Hey, {user?.name || "User"}! 👋
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-orange-400 hover:text-white font-medium py-3 text-center transition-colors rounded-2xl hover:bg-gray-700/50"
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            {sidebarCollapsed ? (
              <span>⏻</span>
            ) : (
              <>
                <span className="md:hidden lg:inline">Logout</span>
                <span className="hidden md:inline lg:hidden">⏻</span>
              </>
            )}
          </button>
        </div>

        {/* Top Creators - Scrollable */}
        {!sidebarCollapsed && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-6 hidden lg:block border border-gray-700/30">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-400 tracking-wide">
                Top Creators
              </h3>
            </div>

            <div className="space-y-4">
              {loadingCreators ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : (
                topCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-700/40 transition-colors cursor-pointer border border-gray-700/20 hover:border-yellow-500/30"
                    onClick={() => handleCreatorClick(creator.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-yellow-400/50">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-100 text-sm hover:text-yellow-400 transition-colors">
                          {creator.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {creator.handle}
                        </div>
                      </div>
                    </div>

                    {creator.subscribed ? (
                      <Badge className="bg-gray-700/70 text-gray-200 border border-gray-600/50 text-xs px-3 py-1">
                        Subscribed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs px-4 py-1 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle follow action here
                        }}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 py-8 md:py-4 lg:py-8 overflow-y-auto ${
          sidebarCollapsed ? "ml-16" : "ml-80"
        } md:ml-16 lg:${
          sidebarCollapsed ? "ml-16" : "ml-80"
        } transition-all duration-300`}
      >
        <div
          className={`${
            activeTab === "store"
              ? "max-w-6xl"
              : activeTab === "products"
              ? "max-w-5xl"
              : activeTab === "subscriptions"
              ? "max-w-7xl"
              : activeTab === "creators"
              ? "max-w-7xl"
              : activeTab === "livecreators"
              ? "max-w-7xl"
              : "max-w-2xl"
          } mx-auto px-6 md:px-4 lg:px-6`}
        >
                      {activeTab === "store" ? (
              renderStoreContent()
            ) : activeTab === "products" ? (
              renderMyProductsContent()
            ) : activeTab === "subscriptions" ? (
              renderSubscriptionsContent()
            ) : activeTab === "creators" ? (
              renderCreatorsContent()
            ) : activeTab === "livecreators" ? (
              renderLiveCreatorsContent()
            ) : (
            <div className="space-y-8 md:space-y-6 lg:space-y-8">
              {post.map((post) => (
                <Card
                  key={post.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/40 shadow-xl relative overflow-hidden"
                >
                  <CardContent className="p-6 md:p-4 lg:p-6">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-yellow-400/50">
                          <AvatarImage
                            src={post.creator.avatar}
                            alt={post.creator.name}
                          />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {post.creator.name.charAt(1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-yellow-400 text-lg">
                            {post.creator.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {post.time}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-100 text-lg md:text-base lg:text-lg mb-4">
                      {post.content}
                    </p>

                    {/* Post Image */}
                    {post.image && (
                      <div className="relative mb-4">
                        <img
                          src={post.image}
                          alt="Post content"
                          className="w-full h-80 md:h-60 lg:h-80 object-cover rounded-2xl"
                        />

                        {/* Paywall Overlay */}
                        {post.isPaid && !post.isUnlocked && (
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-transparent rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-sm">
                            <Lock className="w-12 h-12 text-yellow-400 mb-4" />
                            <div className="text-gray-100 mb-6 text-lg md:text-base lg:text-lg">
                              This post is behind a paywall.
                              <br />
                              <span className="font-bold text-yellow-400">
                                Unlock for {post.price}
                              </span>
                            </div>
                            <Button onClick={()=>router.push(`/consumer-channel/${post.id}/media-payment`)} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold">
                              Unlock Now
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/40">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLikeToggle(post.id)}
                          className={`flex items-center gap-2 transition-colors ${
                            likedPosts.has(post.id) || post.isLiked
                              ? "text-red-400"
                              : "text-gray-400 hover:text-red-400"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              likedPosts.has(post.id) || post.isLiked
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {post.likes}
                          </span>
                        </button>
                        <button
                          className={`flex items-center gap-2 ${
                            visibleComments[post.id]
                              ? "text-blue-400"
                              : "text-gray-400 hover:text-blue-400"
                          } transition-colors`}
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {commentCount[post.id]}
                          </span>
                          <span className="ml-1 text-xs">
                            {visibleComments[post.id] ? "Hide" : "Show"}
                          </span>
                        </button>
                        <button
                          className="flex items-center gap-2 text-green-500 hover:text-green-700 transition-colors"
                          onClick={() => setShowTipModal({ postId: post.id })}
                          title="Tip the creator"
                        >
                          <DollarSign size={20} />
                          <span className="text-sm">Tip</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tip Modal */}
                    {showTipModal.postId === post.id && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                        <div className="bg-white rounded-lg p-6 shadow-lg w-80">
                          <h2 className="text-lg font-bold mb-2 text-gray-900">
                            Tip the Creator
                          </h2>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tipInput}
                            onChange={(e) => setTipInput(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full border rounded px-3 py-2 mb-2 text-black"
                          />
                          {tipError && (
                            <div className="text-red-600 mb-2">{tipError}</div>
                          )}
                          {tipSuccess && (
                            <div className="text-green-600 mb-2">
                              {tipSuccess}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                              onClick={() => handleTip(post.id)}
                              disabled={tipLoading}
                            >
                              {tipLoading ? "Tipping..." : "Send Tip"}
                            </button>
                            <button
                              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                              onClick={() => setShowTipModal({ postId: null })}
                              disabled={tipLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tips Section */}
                    {post.tips && post.tips.count > 0 && (
                      <div className="mt-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-4 border border-green-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="font-semibold text-green-400 text-sm">
                              Tips Received
                            </span>
                          </div>
                          <div className="text-green-400 font-bold text-sm">
                            Total: ₹{post.tips.totalAmount}
                          </div>
                        </div>
                        
                        {post.tips.recent.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-gray-300 text-xs font-medium mb-2">
                              Recent Tips ({post.tips.count} total)
                            </div>
                            {post.tips.recent.map((tip) => (
                              <div key={tip.id} className="flex items-center gap-3 text-sm">
                                <Image
                                  src={tip.user.avatar}
                                  alt={tip.user.name}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover border border-green-500/30"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-gray-200 font-medium">
                                    {tip.user.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-semibold">
                                      ₹{tip.amount}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      {new Date(tip.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {post.tips.count > 5 && (
                              <div className="text-gray-400 text-xs text-center pt-2 border-t border-green-700/30">
                                ... and {post.tips.count - 5} more tips
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comments Section */}
                    {visibleComments[post.id] && (
                      <div className="mt-4">
                        <div className="mb-2 font-semibold text-gray-300 text-sm">
                          Comments
                        </div>
                        {loadingComments[post.id] ? (
                          <div className="text-gray-400 text-xs">
                            Loading comments...
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(comments[post.id] || []).length === 0 && (
                              <div className="text-gray-500 text-xs">
                                No comments yet.
                              </div>
                            )}
                            {(comments[post.id] || []).map((comment) => (
                              <div
                                key={comment.id}
                                className="flex items-start gap-2 text-sm group"
                              >
                                <Image
                                  src={
                                    comment.user?.profile?.avatarUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      comment.user?.name || "U"
                                    )}`
                                  }
                                  alt={comment.user?.name || "User"}
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-700"
                                />
                                <div className="flex-1">
                                  <span className="font-medium text-gray-200">
                                    {comment.user?.name || "User"}
                                  </span>
                                  <span className="ml-2 text-gray-400">
                                    {comment.content}
                                  </span>
                                </div>
                                {/* Delete button for own comment */}
                                {session?.user &&
                                  comment.userId ===
                                    (session.user as SessionUser).id && (
                                    <button
                                      className="ml-2 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                      title="Delete comment"
                                      onClick={() =>
                                        handleDeleteComment(post.id, comment.id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add Comment Form */}
                        {session?.user && (
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ""}
                              onChange={(e) =>
                                handleCommentInputChange(
                                  post.id,
                                  e.target.value
                                )
                              }
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleCommentSubmit(post.id);
                              }}
                              disabled={submittingComment[post.id]}
                            />
                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={
                                submittingComment[post.id] ||
                                !commentInputs[post.id]?.trim()
                              }
                              className="px-3 py-2 rounded bg-yellow-500 text-black font-semibold text-xs hover:bg-yellow-600 disabled:opacity-60"
                            >
                              {submittingComment[post.id]
                                ? "Posting..."
                                : "Post"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}