import { Home, Compass, Users, Bell, Settings, Star, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

interface ConsumerSidebarProps {
  userName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ConsumerSidebar({ userName, activeTab, setActiveTab }: ConsumerSidebarProps) {
  const router = useRouter();
  return (
    <aside className="flex flex-col h-full w-72 bg-white shadow-xl border-r border-gray-100 p-6 justify-between">
      <div>
        {/* NAVIGATION */}
        <div className="mb-4">
          <div className="text-xs font-bold text-gray-400 tracking-widest mb-3 pl-1">NAVIGATION</div>
          <nav className="flex flex-col gap-2">
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold transition-all w-full text-left ${activeTab === 'home' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('home')}
            >
              <Home className="w-5 h-5" />
              Home
            </button>
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold transition-all w-full text-left ${activeTab === 'explore' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('explore')}
            >
              <Compass className="w-5 h-5" />
              Explore
            </button>
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold transition-all w-full text-left ${activeTab === 'community' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('community')}
            >
              <Users className="w-5 h-5" />
              Community
              <span className="ml-auto bg-purple-100 text-purple-600 text-xs font-bold rounded-full px-2 py-0.5">12</span>
            </button>
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold transition-all w-full text-left ${activeTab === 'notifications' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="w-5 h-5" />
              Notifications
              <span className="ml-auto bg-purple-100 text-purple-600 text-xs font-bold rounded-full px-2 py-0.5">3</span>
            </button>
            <button
              className={`flex items-center gap-3 px-4 py-2 rounded-full font-semibold transition-all w-full text-left ${activeTab === 'settings' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </div>
        {/* MEMBERSHIPS (empty for now) */}
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-400 tracking-widest mb-2 pl-1">MEMBERSHIPS</div>
        </div>
        {/* RECENTLY VISITED */}
        <div className="mb-8">
          <div className="text-xs font-bold text-gray-400 tracking-widest mb-2 pl-1">RECENTLY VISITED</div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User className="w-5 h-5" /></span>
            <span className="font-medium text-gray-700">Aadhar Batra</span>
            <span className="ml-auto text-gray-300">&rarr;</span>
          </div>
        </div>
        {/* Become a Creator Button */}
        <button className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-base shadow-lg hover:scale-[1.02] transition mb-4" onClick={() => router.push('/signup-creator')}>
          Become a Creator
        </button>
      </div>
      {/* User Info at Bottom */}
      <div className="flex flex-col items-start gap-1 mt-8 border-t border-gray-100 pt-4">
        <div className="font-semibold text-lg">{userName}</div>
        <Badge className="bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs">Member</Badge>
      </div>
    </aside>
  );
} 