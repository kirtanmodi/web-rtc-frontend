import Link from "next/link";

export default function Navbar(): JSX.Element {
  return (
    <nav style={{ padding: "1rem", backgroundColor: "#0070f3" }}>
      <ul style={{ display: "flex", listStyle: "none", justifyContent: "center", gap: "1rem" }}>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/hello">Hello Page</Link>
        </li>
        <li>
          <Link href="/post/1">Dynamic Post (1)</Link>
        </li>
        <li>
          <Link href="/video-call">Video Call</Link>
        </li>
      </ul>
    </nav>
  );
}
