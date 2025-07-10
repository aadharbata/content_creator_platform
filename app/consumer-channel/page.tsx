"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
  Menu,
  Search,
  Play,
  Image as LucideImage,
  Code,
  Book,
  Video,
  Headphones,
  Grid3X3,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'CREATOR' | 'CONSUMER' | 'ADMIN';
}

interface TopCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  subscriberCount: number;
  subscribed: boolean;
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
}

interface Product {
  id: string;
  title: string;
  price: number;
  type: 'image' | 'video' | 'course' | 'template' | 'software' | 'ebook' | 'audio' | 'physical';
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  thumbnail: string;
  rating: number;
  sales: number;
}

const samplePosts: Post[] = [
  {
    id: '1',
    creator: {
      name: '@SophieRae',
      handle: '@SophieRae',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    time: '2 hours ago',
    content: "Hey loves! Here's a sneak peek from my latest shoot 💖✨",
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    likes: 234,
    comments: 45
  },
  {
    id: '2',
    creator: {
      name: '@JakeWild',
      handle: '@JakeWild',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    time: '5 hours ago',
    content: 'Unlock this exclusive video for more 🔥',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    isPaid: true,
    price: '$9.99',
    likes: 189,
    comments: 32
  },
  {
    id: '3',
    creator: {
      name: '@LunaDream',
      handle: '@LunaDream',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
    },
    time: '1 day ago',
    content: 'Thank you all for 10k subs! Special surprise coming soon 🎉',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
    likes: 456,
    comments: 78
  },
  {
    id: '4',
    creator: {
      name: '@MaxHeat',
      handle: '@MaxHeat',
      avatar: 'https://randomuser.me/api/portraits/men/76.jpg'
    },
    time: '2 days ago',
    content: 'Unlock my latest set for exclusive content! 😏',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
    isPaid: true,
    price: '$14.99',
    likes: 298,
    comments: 67
  },
  {
    id: '5',
    creator: {
      name: '@NovaSky',
      handle: '@NovaSky',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
    },
    time: '3 days ago',
    content: 'Behind the scenes from my latest collab! 🌟',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    likes: 376,
    comments: 54
  },
  {
    id: '6',
    creator: {
      name: '@EliStone',
      handle: '@EliStone',
      avatar: 'https://randomuser.me/api/portraits/men/23.jpg'
    },
    time: '4 days ago',
    content: 'Unlock my new video for exclusive tips! 🎥',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    isPaid: true,
    price: '$7.99',
    likes: 167,
    comments: 29
  }
];

const STORE_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Neon Abstract Patterns',
    price: 299,
    type: 'image',
    creator: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
    sales: 847
  },
  {
    id: '2',
    title: 'City Skyline 4K',
    price: 149,
    type: 'video',
    creator: { name: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop',
    rating: 4.8,
    sales: 623
  },
  {
    id: '3',
    title: 'UI Design Kit',
    price: 79,
    type: 'template',
    creator: { name: 'Lisa Chang', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    sales: 756
  },
  {
    id: '4',
    title: 'Motion Graphics Course',
    price: 299,
    type: 'course',
    creator: { name: 'Jake Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
    rating: 4.9,
    sales: 1234
  },
  {
    id: '5',
    title: 'Minimalist Icons',
    price: 49,
    type: 'template',
    creator: { name: 'Chris Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
    rating: 4.4,
    sales: 223
  },
  {
    id: '6',
    title: 'Creative T-Shirt',
    price: 499,
    type: 'physical',
    creator: { name: 'Emily Stone', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    sales: 312
  }
];

const TYPE_ICONS = {
  image: LucideImage,
  video: Video,
  course: Play,
  template: Grid3X3,
  software: Code,
  ebook: Book,
  audio: Headphones,
  physical: Package
};

export default function ConsumerChannelPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('feed');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [post, setpost] = useState<Post[]>([]);
  // Store state
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [storeActiveTab, setStoreActiveTab] = useState('top');

  useEffect(() => {
    if (status === 'loading') return;
    
    const user = session?.user as SessionUser | undefined;
    if (!session || !user || user.role !== 'CONSUMER') {
      router.replace('/login');
    }
  }, [session, status, router]);

  //fetch posts
  useEffect(()=>{
    const fetchPost = async () => {
      try {
        const res = await axios.get("/api/posts");
        console.log("Response of fetching posts: ", res);
        if (res.status===200){
          setpost(res.data.posts);
        } else if (res.status===500){
          console.log("Error in fetching post with status code 500");
        }
      } catch (error) {
        console.log("Error in fetching post: ", error);
      }
    }
    fetchPost();
  }, []);

  // Fetch top creators
  useEffect(()=>{
    const fetchTopCreators = async () => {
      try {
        const res = await axios.get("/api/creators");
        console.log("Response from fetching top creators: ", res);
        if (res.status===200){
          setTopCreators(res.data.creators);
        } else if (res.status===500){
          console.log("Error in fetching top creators with status code 500: ", res);
        }
      } catch (error) {
        console.log("Error in fetching top creators: ", error);
      } finally {
        setLoadingCreators(false);
      }
    }

    fetchTopCreators();
  }, []);

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/creator/${creatorId}`);
  };

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/'
    });
    // Force redirect to home page
    window.location.href = '/';
  };

  // Store filtering logic
  const filteredProducts = STORE_PRODUCTS.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
                         product.creator.name.toLowerCase().includes(storeSearchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || product.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Store component
  const renderStoreContent = () => (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-100">Product Store</h2>
          <nav className="flex items-center space-x-2 bg-gray-800/50 p-1 rounded-full">
            <button 
              onClick={() => setStoreActiveTab('top')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                storeActiveTab === 'top' 
                  ? 'bg-yellow-500 text-black shadow-sm' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Top Products</span>
            </button>
            <button 
              onClick={() => setStoreActiveTab('following')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                storeActiveTab === 'following' 
                  ? 'bg-yellow-500 text-black shadow-sm' 
                  : 'text-gray-300 hover:text-white'
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const IconComponent = TYPE_ICONS[product.type];
          return (
            <Card key={product.id} className="group cursor-pointer bg-gray-800/50 border-gray-700/40 hover:bg-gray-700/40 transition-all duration-200">
              <div className="relative">
                {/* Product Image */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Type indicator */}
                  <div className="absolute top-2 right-2">
                    <div className="bg-black/60 rounded-full p-1.5">
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* Video play indicator */}
                  {product.type === 'video' && (
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
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-100 text-base line-clamp-1 flex-1 mr-2">
                      {product.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={product.creator.avatar} alt={product.creator.name} />
                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                          {product.creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-300 truncate">{product.creator.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-gray-300">{product.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No products found */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold mb-2 text-gray-400">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );

  if (status === 'loading') {
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
  if (!session || !user || user.role !== 'CONSUMER') {
    return null;
  }

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'store', label: 'Product Store', icon: Store },
    { id: 'products', label: 'My Products', icon: Package },
    { id: 'subscriptions', label: 'Manage Subscriptions', icon: CreditCard },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-50 flex">
      {/* Sidebar - Fixed and Scrollable */}
      <aside className={`fixed left-0 top-0 h-screen ${sidebarCollapsed ? 'w-16' : 'w-80'} md:w-16 lg:${sidebarCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-gray-900/95 via-black/90 to-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col p-6 space-y-6 overflow-y-auto z-10 transition-all duration-300`}>
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
               className={`w-full flex items-center gap-4 ${sidebarCollapsed ? 'px-2 justify-center' : 'px-6'} md:px-2 md:justify-center lg:${sidebarCollapsed ? 'px-2 justify-center' : 'px-6 justify-start'} py-4 rounded-2xl text-left transition-all duration-200 ${
                 activeTab === item.id
                   ? 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white shadow-lg backdrop-blur-sm'
                   : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
               }`}
               title={sidebarCollapsed ? item.label : undefined}
             >
               <item.icon className="w-5 h-5 flex-shrink-0" />
               {!sidebarCollapsed && (
                 <span className="font-medium md:hidden lg:inline">{item.label}</span>
               )}
             </button>
           ))}
         </nav>
        
                 {/* User Greeting & Logout */}
         <div className="space-y-3">
           {!sidebarCollapsed && (
             <div className="text-center py-2">
               <p className="text-gray-300 text-sm font-medium">
                 Hey, {user?.name || 'User'}! 👋
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
                         <AvatarFallback className="bg-gray-700 text-white">{creator.name.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div>
                         <div className="font-medium text-gray-100 text-sm hover:text-yellow-400 transition-colors">{creator.name}</div>
                         <div className="text-gray-400 text-xs">{creator.handle}</div>
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
      <main className={`flex-1 py-8 md:py-4 lg:py-8 overflow-y-auto ${sidebarCollapsed ? 'ml-16' : 'ml-80'} md:ml-16 lg:${sidebarCollapsed ? 'ml-16' : 'ml-80'} transition-all duration-300`}>
        <div className={`${activeTab === 'store' ? 'max-w-6xl' : 'max-w-2xl'} mx-auto px-6 md:px-4 lg:px-6`}>
          {activeTab === 'store' ? (
            renderStoreContent()
          ) : (
            <div className="space-y-8 md:space-y-6 lg:space-y-8">
              {post.map((post) => (
              <Card key={post.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/70 backdrop-blur-sm border border-gray-700/40 shadow-xl relative overflow-hidden">
                <CardContent className="p-6 md:p-4 lg:p-6">
                  {/* Post Header */}
                                      <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-yellow-400/50">
                        <AvatarImage src={post.creator.avatar} alt={post.creator.name} />
                        <AvatarFallback className="bg-gray-700 text-white">{post.creator.name.charAt(1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-yellow-400 text-lg">{post.creator.name}</div>
                        <div className="text-gray-400 text-sm">{post.time}</div>
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
                  <p className="text-gray-100 text-lg md:text-base lg:text-lg mb-4">{post.content}</p>
                  
                  {/* Post Image */}
                  {post.image && (
                    <div className="relative mb-4">
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full h-80 md:h-60 lg:h-80 object-cover rounded-2xl"
                      />
                      
                      {/* Paywall Overlay */}
                      {post.isPaid && (
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-transparent rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-sm">
                          <Lock className="w-12 h-12 text-yellow-400 mb-4" />
                          <div className="text-gray-100 mb-6 text-lg md:text-base lg:text-lg">
                            This post is behind a paywall.<br />
                            <span className="font-bold text-yellow-400">Unlock for {post.price}</span>
                          </div>
                          <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold">
                            Unlock Now
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/40">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                        <Share className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
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