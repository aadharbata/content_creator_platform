'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizonal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black/20 border-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!inputValue.trim()}>
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}; 