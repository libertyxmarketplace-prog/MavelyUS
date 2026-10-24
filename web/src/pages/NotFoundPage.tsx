import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12 select-none">
      <div className="flex flex-col items-center text-center max-w-md mx-auto animate-in fade-in-50 duration-300">
        {/* Massive 404 Headline */}
        <h1 className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tight text-white leading-none">
          404
        </h1>

        {/* Clean Subtitle & Description */}
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-6">
          Page not found
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Pill Buttons (Matching exact user screenshot) */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs sm:text-sm hover:bg-zinc-200 transition-all shadow-md active:scale-95"
          >
            Go home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#18181b] text-white border border-zinc-800 font-semibold text-xs sm:text-sm hover:bg-zinc-800 transition-all active:scale-95"
          >
            Browse pages
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
