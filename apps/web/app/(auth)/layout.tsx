import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 text-2xl font-bold text-indigo-600">
          Prezence
        </Link>
        {children}
      </div>
      <footer className="py-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Prezence
      </footer>
    </div>
  );
}
