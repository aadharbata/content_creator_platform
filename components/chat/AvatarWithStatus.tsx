import { User } from './dummy-data';

interface AvatarWithStatusProps {
  user: User;
}

export const AvatarWithStatus = ({ user }: AvatarWithStatusProps) => (
  <div className="relative flex-shrink-0">
    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
    {user.isOnline && (
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
    )}
  </div>
); 