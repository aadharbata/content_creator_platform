import { Settings, LogOut } from 'lucide-react';

export const UserProfile = () => (
  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
    <div className="flex items-center">
      <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Current User" className="w-10 h-10 rounded-full" />
      <div className="ml-3 flex-1">
        <p className="font-semibold text-sm">Your Name</p>
        <p className="text-xs text-green-500">Online</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
          <Settings className="w-5 h-5 text-slate-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
          <LogOut className="w-5 h-5 text-slate-500" />
        </button>
      </div>
    </div>
  </div>
); 