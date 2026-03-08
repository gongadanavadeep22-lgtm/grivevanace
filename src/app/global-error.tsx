"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0f172a", color: "#f1f5f9", fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Application error</h1>
          <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: "1.5rem", padding: "0.5rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
