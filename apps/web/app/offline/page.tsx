'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl" role="img" aria-label="No internet connection">
        📡
      </div>
      <h1 className="text-2xl font-semibold text-white">You&apos;re offline</h1>
      <p className="text-slate-400 max-w-sm">
        Prezence needs an internet connection to sync your profile. Check your
        connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
