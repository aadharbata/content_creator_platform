"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPaidOnly, setIsPaidOnly] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const creatorId = params?.id as string | undefined;
  const { data: session, status } = useSession();

  // Check if user is authenticated and is the correct creator
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (!session) {
      router.push('/login');
      return;
    }

    const sessionUserId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    if (userRole !== 'CREATOR') {
      router.push('/consumer-channel');
      return;
    }
    
    if (sessionUserId !== creatorId) {
      router.push(`/creator/${sessionUserId}/dashboard`);
      return;
    }
  }, [session, status, creatorId, router]);

  if (status === 'loading') {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 max-w-xl mx-auto text-red-600 font-bold">
        Please login to create posts.
      </div>
    );
  }

  if (!creatorId) {
    return (
      <div className="p-6 max-w-xl mx-auto text-red-600 font-bold">
        Invalid creator ID in URL.
      </div>
    );
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const filtered = files.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setMedia(filtered);
    setPreviews(filtered.map((f) => URL.createObjectURL(f)));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const filtered = files.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setMedia(filtered);
    setPreviews(filtered.map((f) => URL.createObjectURL(f)));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert("Please login to create posts");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("isPaidOnly", String(isPaidOnly));
    formData.append("creatorId", creatorId);
    media.forEach((f) => formData.append("image", f));

    try {
      console.log("Creating post with NextAuth session...");
      const res = await axios.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Post created successfully: ", res);
      if (res.status === 200) {
        router.push(`/creator/${creatorId}/dashboard?tab=posts`);
      } else {
        alert("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post: ", error);
      alert("Failed to create post");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          className="block border p-2 my-2 w-full rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          className="block border p-2 my-2 w-full rounded"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <label className="block my-2">
          <input
            type="checkbox"
            checked={isPaidOnly}
            onChange={(e) => setIsPaidOnly(e.target.checked)}
          />{" "}
          Visible only to subscribed users
        </label>
        <div
          className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${
            dragActive
              ? "border-indigo-600 bg-indigo-50"
              : "border-gray-300 bg-white"
          } px-6 py-10 transition-all duration-300 ease-in-out cursor-pointer relative`}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={handleMediaChange}
          />
          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Upload className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-indigo-600 hover:text-indigo-500 text-center">
            Click to upload{" "}
            <span className="font-normal text-gray-500">or drag and drop</span>
          </p>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Only images and videos are accepted
          </p>
        </div>
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-4 my-4 justify-center">
            {previews.map((src, i) =>
              media[i]?.type.startsWith("image/") ? (
                <img
                  key={i}
                  src={src}
                  alt="preview"
                  className="w-28 h-28 object-cover rounded shadow"
                />
              ) : media[i]?.type.startsWith("video/") ? (
                <video
                  key={i}
                  src={src}
                  controls
                  className="w-28 h-28 object-cover rounded shadow"
                />
              ) : null
            )}
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 mt-4 rounded font-semibold hover:bg-blue-600 transition-colors w-full"
        >
          Post
        </button>
      </form>
    </div>
  );
}
