import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const EMBED_IMAGES = [
  {
    id: 'orlando-support',
    name: 'Orlando Support',
    image: '/embeds/orlando-support.png',
    blush: 'from-sky-500/35 via-cyan-500/20 to-blue-600/30',
    glow: 'rgba(2, 132, 199, 0.4)'
  },
  {
    id: 'alabama-assistance',
    name: 'Assistance Support',
    image: '/embeds/alabama-assistance.png',
    blush: 'from-orange-500/35 via-amber-500/20 to-rose-600/30',
    glow: 'rgba(249, 115, 22, 0.4)'
  },
  {
    id: 'staff-applications',
    name: 'Staff Applications',
    image: '/embeds/staff-applications.png',
    blush: 'from-rose-500/35 via-red-500/20 to-amber-600/30',
    glow: 'rgba(239, 68, 68, 0.4)'
  },
  {
    id: 'promotion-notice',
    name: 'Promotion Notice',
    image: '/embeds/promotion-notice.png',
    blush: 'from-amber-500/35 via-yellow-500/20 to-orange-600/30',
    glow: 'rgba(234, 179, 8, 0.4)'
  }
];

export function EmbedShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const active = EMBED_IMAGES[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % EMBED_IMAGES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + EMBED_IMAGES.length) % EMBED_IMAGES.length);
  };

  // Auto-advance rotation every 30 seconds as requested
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      handleNext();
    }, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="relative w-full max-w-[480px] mx-auto select-none group flex items-center justify-center p-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── DYNAMIC "BLUSH" AMBIENT BACKDROP ─── */}
      {/* Radiant mesh glow that softly "blushes" the website background behind the image */}
      <div
        className={`pointer-events-none absolute -inset-8 sm:-inset-16 rounded-full bg-gradient-to-tr ${active.blush} blur-[80px] sm:blur-[110px] opacity-85 transition-all duration-700 -z-10`}
      />
      <div
        className="pointer-events-none absolute -inset-2 rounded-2xl opacity-60 blur-2xl transition-all duration-500 -z-10"
        style={{
          boxShadow: `0 0 70px 15px ${active.glow}`
        }}
      />

      {/* Floating Left Arrow: positioned further away and hidden until someone hovers around it */}
      <button
        onClick={handlePrev}
        aria-label="Previous Image"
        className="absolute -left-5 sm:-left-12 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
      >
        <ChevronLeft className="size-6 text-white" />
      </button>

      {/* Floating Right Arrow: positioned further away and hidden until someone hovers around it */}
      <button
        onClick={handleNext}
        aria-label="Next Image"
        className="absolute -right-5 sm:-right-12 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
      >
        <ChevronRight className="size-6 text-white" />
      </button>

      {/* ─── PURE IMAGE ONLY (NO UI CONTAINER/BACKGROUND) ─── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
        style={{
          transform: 'perspective(1000px) rotateY(-3deg) rotateX(1.5deg)',
          transformOrigin: 'center center'
        }}
      >
        <img
          src={active.image}
          alt={active.name}
          className="w-full h-auto object-contain block select-none drop-shadow-2xl"
          loading="eager"
        />

        {/* Subtle Bottom Image Dot Indicators (hidden until hovered) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {EMBED_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to image ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
