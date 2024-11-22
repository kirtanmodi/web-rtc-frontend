"use client";

export default function ErrorPage({ error }: { error: Error }): JSX.Element {
  console.error(error); // Log the error for debugging

  return (
    <div>
      <h1>Error Loading Post</h1>
      <p>Something went wrong while fetching the post. Please try again later.</p>
    </div>
  );
}
