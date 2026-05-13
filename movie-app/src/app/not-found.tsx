export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Movie Not Found</h2>
        <p className="text-gray-400 mb-8">The movie you are looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}