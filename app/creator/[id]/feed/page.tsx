"use client"
import { useEffect, useState } from 'react'

export default function CreatorFeed({ params }: { params: { id: string } }) {
  const [posts, setPosts] = useState<any[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/creator/${params.id}/posts`)
      const data = await res.json()
      setPosts(data.posts)
      setIsSubscribed(data.isSubscribed)
    }
    load()
  }, [params.id])

  const likePost = async (postId: string) => {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
    setPosts(posts.map(p => p.id === postId ? { ...p, liked: true } : p))
  }

  const addComment = async (postId: string, comment: string) => {
    await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1>Creator Feed</h1>
      {posts.map(post => (
        <div key={post.id} className="border p-4 my-4 rounded">
          <h2 className="text-lg font-bold">{post.title}</h2>
          <p>{post.content}</p>

          {isSubscribed && (
            <div className="mt-2">
              <button
                onClick={() => likePost(post.id)}
                className="text-blue-500 mr-4"
              >
                👍 Like
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const comment = (e.currentTarget as any).comment.value
                  addComment(post.id, comment)
                  e.currentTarget.reset()
                }}
              >
                <input
                  name="comment"
                  placeholder="Write a comment..."
                  className="border px-2 py-1 w-full mt-2"
                />
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 