import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const EMBED_IMAGES = [
  {
    id: 'orlando-support',
    name: 'Orlando Support',
    image: '/embeds/orlando-support.png',
    ambientRgba: 'rgba(2, 132, 199, 0.22)'
  },
  {
    id: 'alabama-assistance',
    name: 'Assistance Support',
    image: '/embeds/alabama-assistance.png',
    ambientRgba: 'rgba(234, 88, 12, 0.20)'
  },
  {
    id: 'staff-applications',
    name: 'Staff Applications',
    image: '/embeds/staff-applications.png',
    ambientRgba: 'rgba(220, 38, 38, 0.20)'
  },
  {
    id: 'promotion-notice',
    name: 'Promotion Notice',
    image: '/embeds/promotion-notice.png',
    ambientRgba: 'rgba(202, 138, 4, 0.20)'
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
      className="relative w-full max-w-[500px] mx-auto select-none group flex items-center justify-center p-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── REFINED STUDIO-GRADE AMBIENT LIGHTING (NO VIBE-CODED BLOBS) ─── */}
      <div
        className="pointer-events-none absolute -inset-8 sm:-inset-16 transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(ellipse 85% 65% at 50% 50%, ${active.ambientRgba} 0%, rgba(14, 165, 233, 0.03) 45%, transparent 75%)`,
          filter: 'blur(35px)'
        }}
      />

      {/* Floating Left Arrow: positioned further away and hidden until hovered */}
      <button
        onClick={handlePrev}
        aria-label="Previous Image"
        className="absolute -left-5 sm:-left-12 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-[#121318]/90 hover:bg-[#1a1b22] border border-white/15 text-white flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer"
      >
        <ChevronLeft className="size-5 sm:size-6 text-white/90" />
      </button>

      {/* Floating Right Arrow: positioned further away and hidden until hovered */}
      <button
        onClick={handleNext}
        aria-label="Next Image"
        className="absolute -right-5 sm:-right-12 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-11 rounded-full bg-[#121318]/90 hover:bg-[#1a1b22] border border-white/15 text-white flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto cursor-pointer"
      >
        <ChevronRight className="size-5 sm:size-6 text-white/90" />
      </button>

      {/* ─── PURE IMAGE ONLY (NO UI CONTAINER/BACKGROUND) ─── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] transition-transform duration-500 hover:scale-[1.01]"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          transform: 'perspective(1200px) rotateY(-2.5deg) rotateX(1deg)',
          transformOrigin: 'center center'
        }}
      >
        <img
          src={active.image}
          alt={active.name}
          className="w-full h-auto object-contain block select-none"
          loading="eager"
        />

        {/* Subtle Bottom Image Dot Indicators (hidden until hovered) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
