import { PageProps } from "@/.next/types/app/layout";

interface PostPageProps extends PageProps {
  params: Promise<{ id: string }>; // Adjust according to your needs
}

// Add type for post data
interface Post {
  title: string;
  body: string;
}

async function fetchPostData(id: string): Promise<Post> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API base URL is not configured");
  }

  try {
    const response = await fetch(`${apiBaseUrl}/posts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch post data: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    throw new Error("Failed to load post data");
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;

  try {
    const post = await fetchPostData(id);

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-700">{post.body}</p>
      </div>
    );
  } catch (error) {
    console.error("Error in PostPage:", error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl text-red-600">Error Loading Post</h1>
        <p>Unable to load the requested post. Please try again later.</p>
      </div>
    );
  }
}
