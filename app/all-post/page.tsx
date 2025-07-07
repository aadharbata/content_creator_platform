"use client"
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AllPostsPage() {
  const searchParams = useSearchParams();
  const creatorId = searchParams?.get("creatorId");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) return;
    setLoading(true);
    fetch(`/api/posts?creatorId=${creatorId}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setError(null);
      })
      .catch((err) => setError("Failed to fetch posts."))
      .finally(() => setLoading(false));
  }, [creatorId]);

  if (!creatorId) {
    return <div className="max-w-2xl mx-auto p-8 text-red-600 font-bold">Missing creatorId in URL.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">All Posts</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {posts.length === 0 && !loading && <div>No posts found.</div>}
      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg p-4 bg-white shadow">
            <h2 className="text-lg font-semibold mb-2">{post.title}</h2>
            <p className="mb-2 text-gray-700">{post.content}</p>
            <div className="flex flex-wrap gap-4">
              {post.media?.map((media: any) =>
                media.type === "photo" ? (
                  <img
                    key={media.id}
                    src={media.url}
                    alt="post media"
                    className="w-40 h-40 object-cover rounded"
                  />
                ) : media.type === "video" ? (
                  <video
                    key={media.id}
                    src={media.url}
                    controls
                    className="w-40 h-40 object-cover rounded"
                  />
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 