"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConsumerSidebar from '@/components/ConsumerSidebar';
import { getAuthUser } from '@/lib/auth';
import HomePage from '../home/page';

export default function ConsumerChannelPage() {
  const router = useRouter();
  const user = getAuthUser();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (!user || user.role !== 'CONSUMER') {
      router.replace('/login');
    }
  }, [user, router]);

  let mainContent = null;
  if (activeTab === 'home') {
    mainContent = <HomePage />;
  } else {
    mainContent = (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4 capitalize">{activeTab}</h1>
        <p className="text-lg text-gray-700">This section is coming soon.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ConsumerSidebar userName={user?.name || 'User'} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-0">
        {mainContent}
      </main>
    </div>
  );
} 