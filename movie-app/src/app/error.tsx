export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-text mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}