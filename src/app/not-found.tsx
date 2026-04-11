import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl sm:text-8xl font-bold text-accent-periwinkle font-[family-name:var(--font-heading)]">
        404
      </p>
      <h1 className="text-2xl sm:text-3xl text-text-primary mt-4 font-[family-name:var(--font-heading)]">
        Page Not Found
      </h1>
      <p className="text-text-secondary mt-4 max-w-md">
        This page doesn&apos;t exist. Maybe you&apos;re richer than you think — you just
        took a wrong turn.
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-2xl bg-accent-periwinkle/15 text-accent-periwinkle font-medium hover:bg-accent-periwinkle/25 transition-colors"
      >
        Back to How Poor Am I?
      </Link>
    </main>
  );
}
