"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSocket, connectSocket, disconnectSocket, setSocketAuth } from "@/lib/socket-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Search } from "lucide-react"
import { MessageCircle } from "lucide-react"
import axios from "axios"

// Default avatar for users without a profile image
const DEFAULT_AVATAR_URL = "https://i.postimg.cc/KvnSCtjt/photo-2025-08-11-15-28-05.jpg"

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
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const meId = (session?.user as any)?.id
  const meName = session?.user?.name || "Me"

  const [users, setUsers] = useState<ChatUser[]>([])
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabKey>("ALL")
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const [recentConvos, setRecentConvos] = useState<Array<{ roomId: string; targetUserId: string; targetUserName: string; targetUserAvatar: string | null; lastText: string; lastAt: string | Date; unread: number }>>([])
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({})
  const [lastActivityByUser, setLastActivityByUser] = useState<Record<string, number>>({})

  // Load persisted unread counts from localStorage
  useEffect(() => {
    if (!meId) return
    try {
      const key = `dmUnread_${meId}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setUnreadByRoom(parsed)
      }
    } catch {}
  }, [meId])

  // Persist unread counts whenever they change
  useEffect(() => {
    if (!meId) return
    try {
      const key = `dmUnread_${meId}`
      localStorage.setItem(key, JSON.stringify(unreadByRoom))
    } catch {}
  }, [meId, unreadByRoom])

  // Authenticate and connect socket once we have the session
  useEffect(() => {
    if (status !== "authenticated" || !meId) return
    const socket = getSocket()
    setSocketAuth({ userId: meId, userName: meName })
    if (!socket.connected) connectSocket()

    const handleIncoming = (payload: any) => {
      // payload from server.ts: { id, text, senderId, senderName, timestamp }
      const senderId = payload?.senderId
      const text = payload?.text
      if (!senderId || !text) return
      if (senderId === meId) return // skip own (we add optimistically)

      const roomIdForSender = buildDmRoomId(meId, senderId)

      // Ensure we are joined to this room to keep receiving follow-ups
      try {
        const socket = getSocket()
        socket.emit('joinRoom', { roomId: roomIdForSender, userId: meId, targetUserId: senderId })
      } catch {}

      // Ensure the sender exists in the user list
      setUsers(prev => {
        const idx = prev.findIndex(u => u.id === senderId)
        if (idx === -1) {
          // Add and place on top
          const minimal = { id: senderId, name: payload.senderName || 'User', avatar: null, role: undefined as any, online: true } as any
          return [minimal, ...prev]
        }
        // Move existing user to the top to reflect recent activity
        const moved = [prev[idx], ...prev.filter((_, i) => i !== idx)]
        return moved
      })

      // If the active chat is with this sender, append to current messages
      if (activeUser && activeUser.id === senderId) {
        setMessages(prev => [...prev, {
          userId: payload.senderId,
          userName: payload.senderName,
          text: payload.text,
          createdAt: new Date(payload.timestamp || Date.now()).getTime()
        }])
      } else {
        // Otherwise increment unread count for that room
        setUnreadByRoom(prev => {
        const current = typeof prev[roomIdForSender] === 'number'
          ? (prev[roomIdForSender] as number)
          : parseInt(String(prev[roomIdForSender] ?? 0), 10) || 0
        return { ...prev, [roomIdForSender]: current + 1 }
      })
      }

      // Update last activity for sender to move them to the top
      setLastActivityByUser(prev => ({ ...prev, [senderId]: Date.now() }))

      // Update recents and move this convo to the top (create if missing)
      setRecentConvos(prev => {
        const idx = prev.findIndex(r => r.roomId === roomIdForSender)
        if (idx !== -1) {
          const updated = [...prev]
          updated[idx] = { ...updated[idx], lastText: text, lastAt: new Date().toISOString() }
          // Move to top
          return [updated[idx], ...updated.filter((_, i) => i !== idx)]
        }
        // Create if not present
        const created = {
          roomId: roomIdForSender,
          lastText: text,
          lastAt: new Date().toISOString(),
          targetUserId: senderId,
          targetUserName: payload.senderName || 'User',
          targetUserAvatar: null,
          unread: 0
        }
        return [created, ...prev]
      })
    }

    socket.on('receiveMessage', handleIncoming)

    return () => {
      socket.off('receiveMessage', handleIncoming)
      disconnectSocket()
    }
  }, [status, meId, meName, activeUser])

  // Load recent conversations
  useEffect(() => {
    if (!meId) return
    ;(async () => {
      try {
        const res = await fetch('/api/messages/recent')
        const data = await res.json()
        if (data.success) {
          // Initialize unread counts as 0 (server can be extended later)
          const unreadInit: Record<string, number> = {}
          setRecentConvos(data.recents.map((r: any) => ({ ...r, unread: unreadInit[r.roomId] || 0 })))
          setUnreadByRoom(unreadInit)

          // Prime last-activity map from recents
          setLastActivityByUser(prev => {
            const next = { ...prev }
            data.recents.forEach((r: any) => {
              next[r.targetUserId] = new Date(r.lastAt).getTime()
            })
            return next
          })

          // Join all recent rooms to receive incoming messages and update unread badges
          const socket = getSocket()
          data.recents.forEach((r: any) => {
            socket.emit('joinRoom', { roomId: r.roomId, userId: meId, targetUserId: r.targetUserId })
          })
        }
      } catch {}
    })()
  }, [meId])

  // Initial list load and optional deep-link to=userid
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/users/list?limit=100")
        const data = await res.json()
        const list: ChatUser[] = (data?.users || []).filter((u: any) => u.id !== meId)
        const withPresence = list.map(u => ({ ...u, online: Math.random() > 0.6 }))
        setUsers(withPresence)

        const to = searchParams?.get('to')
        if (to) {
          const target = withPresence.find(u => u.id === to)
          if (target) setActiveUser(target)
        }
      } catch (e) {
        setUsers([])
      }
    }
    load()
  }, [meId, searchParams])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let pool = users
    if (activeTab === "CREATORS") pool = users.filter(u => u.role === "CREATOR")
    if (activeTab === "CONSUMERS") pool = users.filter(u => u.role === "CONSUMER")

    const getScore = (id: string) => {
      const last = lastActivityByUser[id] || 0
      if (last) return last
      const recent = recentConvos.find(r => r.targetUserId === id)
      return recent ? new Date(recent.lastAt).getTime() : 0
    }

    const sorter = (a: ChatUser, b: ChatUser) => getScore(b.id) - getScore(a.id)

    if (!q) {
      return [...pool].sort(sorter)
    }
    const filteredPool = pool.filter(u => (u.name?.toLowerCase().includes(q) || u.handle?.toLowerCase()?.includes(q)))
    return filteredPool.sort(sorter)
  }, [users, query, activeTab, lastActivityByUser, recentConvos])

  const counts = useMemo(() => ({
    all: users.length,
    creators: users.filter(u => u.role === "CREATOR").length,
    consumers: users.filter(u => u.role === "CONSUMER").length,
  }), [users])

  // Join DM room and load history when active user changes
  useEffect(() => {
    const socket = getSocket()
    if (!activeUser || !meId) return
    const roomId = buildDmRoomId(meId, activeUser.id)
    socket.emit('joinRoom', { roomId, userId: meId, targetUserId: activeUser.id })

    // mark unread as read locally when opening
    setUnreadByRoom(prev => ({ ...prev, [roomId]: 0 }))

    // Load persisted history
    ;(async () => {
      try {
        const response = await axios.get(`/api/messages?roomId=${encodeURIComponent(roomId)}`)
        if (response.data.success) {
          const loaded: ChatMessage[] = response.data.messages.map((m: any) => ({
            userId: m.senderId,
            userName: m.senderName,
            text: m.text,
            createdAt: new Date(m.timestamp).getTime()
          }))
          setMessages(loaded)
        } else {
          setMessages([])
        }
      } catch {
        setMessages([])
      }
    })()
  }, [activeUser, meId])

  // Auto scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !activeUser || !meId) return
    const socket = getSocket()
    const roomId = buildDmRoomId(meId, activeUser.id)

    // Optimistic UI
    const optimistic: ChatMessage = { userId: meId, userName: meName, text, createdAt: Date.now() }
    setMessages(prev => [...prev, optimistic])
    setInput("")

    // Update last activity for the recipient to move them to top immediately
    setLastActivityByUser(prev => ({ ...prev, [activeUser.id]: Date.now() }))

    try {
      // Persist to DB
      await axios.post('/api/messages', { roomId, content: text })
    } catch (e) {
      // Keep UI even if save fails; errors are logged
      console.error('Failed to save message:', e)
    }

    try {
      // Real-time delivery via websocket-server semantics
      socket.emit('sendMessage', { conversationId: roomId, content: text })
    } catch (e) {
      console.error('Failed to emit websocket message:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4 -ml-2">
          <button onClick={() => router.push("/consumer-channel")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Go Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User List */}
          <Card className="lg:col-span-1 bg-white border-gray-200 rounded-xl">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users" className="pl-9 h-11 rounded-xl" />
              </div>

              {/* Segmented Tabs */}
              <div className="flex items-center gap-2 mb-3">
                <Segmented value={activeTab} onChange={setActiveTab} counts={counts} />
              </div>

              <div className="max-h-[64vh] overflow-y-auto space-y-2 pr-1">
                {filtered.map((u: ChatUser) => {
                  const roomId = buildDmRoomId(meId, u.id)
                  const unread = unreadByRoom[roomId] || 0
                  return (
                    <button key={u.id} onClick={() => setActiveUser(u)} className={`w-full flex items-center gap-3 rounded-lg border px-3 py-3 text-left bg-white hover:bg-gray-50 ${activeUser?.id === u.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.avatar || DEFAULT_AVATAR_URL} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="font-medium text-gray-900 truncate">{u.name}</span>
                          {unread > 0 && activeUser?.id !== u.id && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-red-600 text-white">{unread}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{u.online ? 'Active now' : 'Last seen recently'}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right: Chat */}
          <Card className="lg:col-span-2 bg-white/95 border-gray-200 shadow-md rounded-2xl">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-gray-900 text-lg">
                {activeUser ? (
                  <span className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden relative ring-2 ring-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeUser.avatar || DEFAULT_AVATAR_URL} alt={activeUser.name} className="w-full h-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${activeUser.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <span>{activeUser.name}</span>
                    {activeUser.role && <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeUser.role === 'CREATOR' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{activeUser.role}</span>}
                  </span>
                ) : 'Select a chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[60vh] overflow-y-auto px-4 py-3 space-y-3 smooth-scroll thin-scrollbar" ref={listRef}>
                {activeUser ? (
                  messages.map((m, i) => (
                    <div key={i} className={`message-item flex ${m.userId === meId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow transition-transform duration-200 ${m.userId === meId ? 'bg-green-600 text-white message-bubble-me' : 'bg-gray-100 text-gray-900 message-bubble'}`}>
                        <div className="font-medium mb-0.5">{m.userId === meId ? 'You' : m.userName}</div>
                        <div>{m.text}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-inner mb-4">
                      <MessageCircle className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-1">Start a conversation</h3>
                    <p className="text-sm text-gray-500">Send a message to get started</p>
                  </div>
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
                  className="transition-all focus:shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!activeUser || !input.trim()}
                  className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UX polish: animations, scrollbar + smooth scroll */}
      <style jsx global>{`
        .smooth-scroll { scroll-behavior: smooth; overscroll-behavior: contain; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        .thin-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }

        @keyframes bubbleIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulseSoft { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .message-item { animation: bubbleIn 180ms ease-out both; }
        .list-item { animation: bubbleIn 140ms ease-out both; }
        .message-bubble, .message-bubble-me { will-change: transform; }
        .animate-pulse-soft { animation: pulseSoft 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

function buildDmRoomId(a?: string, b?: string) {
  if (!a || !b) return ''
  const participants = [a, b].sort()
  return `dm_${participants.join('_')}`
}

function buildRoomId(a?: string, b?: string) {
  if (!a || !b) return ''
  return [a, b].sort().join(':')
}

function Segmented({ value, onChange, counts }: { value: TabKey, onChange: (v: TabKey) => void, counts: { all: number, creators: number, consumers: number } }) {
  const base = "px-4 py-1.5 rounded-full text-sm border transition-colors"
  return (
    <div className="flex items-center gap-2">
      <button className={`${base} ${value === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`} onClick={() => onChange('ALL')}>All <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium ${value==='ALL' ? 'bg-white text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{counts.all}</span></button>
      <button className={`${base} ${value === 'CREATORS' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`} onClick={() => onChange('CREATORS')}>Creators <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium ${value==='CREATORS' ? 'bg-white text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{counts.creators}</span></button>
      <button className={`${base} ${value === 'CONSUMERS' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`} onClick={() => onChange('CONSUMERS')}>Consumers <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium ${value==='CONSUMERS' ? 'bg-white text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>{counts.consumers}</span></button>
    </div>
  )
} 