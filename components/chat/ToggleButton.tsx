// components/chat/ToggleButton.tsx
interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const ToggleButton = ({ label, isActive, onClick }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-white dark:bg-slate-600 shadow-sm'
        : 'text-slate-500 hover:bg-slate-300/50 dark:hover:bg-slate-600/50'
    }`}
  >
    {label}
  </button>
); 