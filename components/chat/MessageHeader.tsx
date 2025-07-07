import { Phone, Video, Info } from 'lucide-react';

interface MessageHeaderProps {
  title: string;
  subtitle: string;
  avatarUrl: string;
  icon: React.ReactNode;
}

export const MessageHeader = ({ title, subtitle, avatarUrl, icon }: MessageHeaderProps) => (
  <div className="flex items-center p-3 border-b border-slate-200 dark:border-slate-700">
    <div className="relative">
      <img src={avatarUrl} alt={title} className="w-10 h-10 rounded-full" />
    </div>
    <div className="ml-3">
      <h2 className="font-semibold text-sm">{title}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
        {icon} {subtitle}
      </p>
    </div>
  </div>
); 