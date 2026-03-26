import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are looking for does not exist or you do not have permission to view it.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
