'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizonal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export function MessageInput({ onSendMessage }: { onSendMessage: (content: string) => void }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      onSendMessage(content);
      setValue("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 border-t border-white/10 flex gap-2">
      <input
        className="flex-1 bg-white/5 text-white px-3 py-2 rounded-md outline-none placeholder:text-gray-400"
        placeholder="Write a message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        disabled={sending}
        className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
} 