"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Search } from "lucide-react"

interface ChatUser {
  id: string
  name: string
  handle?: string | null
  avatar?: string | null
  role?: "CREATOR" | "CONSUMER" | "ADMIN" | string
  online?: boolean
  lastSeenAt?: string | null
}

interface ChatMessage {
  userId: string
  userName: string
  text: string
  createdAt: number
}

type TabKey = "ALL" | "CREATORS" | "CONSUMERS"

export default function ChatLivePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const meId = (session?.user as any)?.id

  const [users, setUsers] = useState<ChatUser[]>([])
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabKey>("ALL")
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const listRef = useRef<HTMLDivElement>(null)

  // Connect socket and inbound messages
  useEffect(() => {
    connectSocket()
    const socket = getSocket()

    socket.on("dm:message", (payload: any) => {
      if (!activeUser) return
      const room = buildRoomId(meId, activeUser.id)
      if (payload?.roomId === room) {
        setMessages((prev) => [...prev, {
          userId: payload.userId,
          userName: payload.userName,
          text: payload.text,
          createdAt: Date.now()
        }])
      }
    })

    return () => {
      socket.off("dm:message")
      disconnectSocket()
    }
  }, [activeUser, meId])

  // Initial list load
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users/list?limit=100")
        const data = await res.json()
        const list: ChatUser[] = (data?.users || []).filter((u: any) => u.id !== meId)
        // Placeholder presence status; wire to real presence if available
        const withPresence = list.map(u => ({ ...u, online: Math.random() > 0.6 }))
        setUsers(withPresence)
      } catch (e) {
        setUsers([])
      }
    }
    load()
  }, [meId])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let pool = users
    if (activeTab === "CREATORS") pool = users.filter(u => u.role === "CREATOR")
    if (activeTab === "CONSUMERS") pool = users.filter(u => u.role === "CONSUMER")
    if (!q) return pool
    return pool.filter(u => (u.name?.toLowerCase().includes(q) || u.handle?.toLowerCase()?.includes(q)))
  }, [users, query, activeTab])

  const counts = useMemo(() => ({
    all: users.length,
    creators: users.filter(u => u.role === "CREATOR").length,
    consumers: users.filter(u => u.role === "CONSUMER").length,
  }), [users])

  // Join DM room when active changes
  useEffect(() => {
    const socket = getSocket()
    if (!activeUser || !meId) return
    const roomId = buildRoomId(meId, activeUser.id)
    socket.emit("dm:join", { roomId })
    setMessages([])
  }, [activeUser, meId])

  // Auto scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !activeUser || !meId) return
    const socket = getSocket()
    const roomId = buildRoomId(meId, activeUser.id)
    const payload = { roomId, userId: meId, userName: session?.user?.name || "Me", text }
    socket.emit("dm:message", payload)
    setMessages(prev => [...prev, { userId: meId, userName: payload.userName, text, createdAt: Date.now() }])
    setInput("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4 -ml-2">
          <button onClick={() => router.push("/consumer-channel")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Go Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User List */}
          <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 text-lg">Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users" className="pl-9" />
              </div>

              {/* Segmented Tabs */}
              <div className="flex items-center gap-2 mb-3">
                <Segmented value={activeTab} onChange={setActiveTab} counts={counts} />
              </div>

              <div className="max-h-[64vh] overflow-y-auto space-y-2">
                {filtered.map((u) => (
                  <button key={u.id} onClick={() => setActiveUser(u)} className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left hover:bg-gray-50 ${activeUser?.id === u.id ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                    <div className="relative w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.avatar || '/placeholder.jpg'} alt={u.name} className="w-full h-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${u.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 truncate">{u.name}</div>
                        {u.role && <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'CREATOR' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.role}</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.online ? 'Active now' : 'Last seen ' + (u.lastSeenAt || 'recently')}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Chat */}
          <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-gray-900 text-lg">
                {activeUser ? (
                  <span className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeUser.avatar || '/placeholder.jpg'} alt={activeUser.name} className="w-full h-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${activeUser.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <span>{activeUser.name}</span>
                    {activeUser.role && <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeUser.role === 'CREATOR' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{activeUser.role}</span>}
                  </span>
                ) : 'Select a chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[60vh] overflow-y-auto px-4 py-3 space-y-3" ref={listRef}>
                {activeUser ? (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.userId === meId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow ${m.userId === meId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <div className="font-medium mb-0.5">{m.userId === meId ? 'You' : m.userName}</div>
                        <div>{m.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">Start a conversation</div>
                )}
              </div>
              {/* Composer */}
              <div className="border-t border-gray-100 p-3 flex items-center gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={activeUser ? `Write a message...` : 'Select a user to start chatting'}
                  disabled={!activeUser}
                />
                <Button onClick={sendMessage} disabled={!activeUser || !input.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function buildRoomId(a?: string, b?: string) {
  if (!a || !b) return ''
  return [a, b].sort().join(':')
}

function Segmented({ value, onChange, counts }: { value: TabKey, onChange: (v: TabKey) => void, counts: { all: number, creators: number, consumers: number } }) {
  const base = "px-3 py-1.5 rounded-full text-sm border"
  return (
    <div className="flex items-center gap-2">
      <button className={`${base} ${value === 'ALL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => onChange('ALL')}>All <span className="ml-1 rounded-full bg-emerald-600 text-white text-xs px-1.5">{counts.all}</span></button>
      <button className={`${base} ${value === 'CREATORS' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => onChange('CREATORS')}>Creators <span className="ml-1 rounded-full bg-purple-600 text-white text-xs px-1.5">{counts.creators}</span></button>
      <button className={`${base} ${value === 'CONSUMERS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => onChange('CONSUMERS')}>Consumers <span className="ml-1 rounded-full bg-blue-600 text-white text-xs px-1.5">{counts.consumers}</span></button>
    </div>
  )
} 