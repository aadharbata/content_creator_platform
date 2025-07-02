"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPaidOnly, setIsPaidOnly] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, isPaidOnly }),
    })
    if (res.ok) {
      router.push('/creator/posts')
    } else {
      alert('Failed to post')
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2>Create a New Post</h2>
      <input
        type="text"
        placeholder="Title"
        className="block border p-2 my-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Content"
        className="block border p-2 my-2 w-full"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <label className="block my-2">
        <input
          type="checkbox"
          checked={isPaidOnly}
          onChange={(e) => setIsPaidOnly(e.target.checked)}
        />
        {' '}Visible only to subscribed users
      </label>
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 mt-2">
        Post
      </button>
    </div>
  )
} 