import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const MOVIES = [
  {
    id: 1,
    title: 'THE BATMAN',
    synopsis: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.',
    poster: 'https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    bg: '#661919',
  },
  {
    id: 2,
    title: 'OPPENHEIMER',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    poster: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    bg: '#3d3d3d',
  },
  {
    id: 3,
    title: 'SPIDER-MAN: ACROSS THE SPIDER-VERSE',
    synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its existence.',
    poster: 'https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    bg: '#8f2336',
  },
  {
    id: 4,
    title: 'DUNE: PART TWO',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    poster: 'https://sfrareview.org/wp-content/uploads/2024/07/dune-part-two.jpg',
    bg: '#8c593b',
  },
];

const TRANSITION_MS = 650;

interface LandingPageProps {
  onBookTickets: (movieTitle: string) => void;
  onOpenDashboard: () => void;
}

export default function LandingPage({ onBookTickets, onOpenDashboard }: LandingPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Preload images
  useEffect(() => {
    MOVIES.forEach((movie) => {
      const img = new Image();
      img.src = movie.poster;
    });
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % MOVIES.length);
    setTimeout(() => setIsAnimating(false), TRANSITION_MS);
  }, [isAnimating]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + MOVIES.length) % MOVIES.length);
    setTimeout(() => setIsAnimating(false), TRANSITION_MS);
  }, [isAnimating]);

  // Auto-slide every 1.4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 1400);
    return () => clearInterval(timer);
  }, [handleNext]);

  const getPosition = (index: number) => {
    const total = MOVIES.length;
    const diff = (index - activeIndex + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === total - 1) return 'left';
    return 'back';
  };

  const activeMovie = MOVIES[activeIndex];

  return (
    <div 
      className="relative w-full h-screen overflow-hidden flex items-center justify-center transition-colors duration-[650ms] ease-out select-none"
      style={{ backgroundColor: activeMovie.bg }}
    >
      {/* 1. Subtle Grain overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10 mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* 2. Giant Ghost Text */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
        <h1 
          className="font-anton text-white/20 tracking-tighter whitespace-nowrap uppercase select-none drop-shadow-2xl"
          style={{ fontSize: 'clamp(80px, 22vw, 340px)' }}
        >
          FLASH SALE
        </h1>
      </div>

      {/* 3. Brand Label & Dashboard Link */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 z-50 flex items-center gap-6">
        <span className="font-anton text-2xl md:text-3xl tracking-wider uppercase text-white drop-shadow-md">
          FAIR-FLASH-GATE
        </span>
        <button 
          onClick={onOpenDashboard}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-semibold text-white/90 uppercase tracking-widest backdrop-blur-md transition-all"
        >
          Live Dashboard ⚡
        </button>
      </div>

      {/* 4. Carousel Cards Container */}
      <div className="relative w-full max-w-6xl h-[55vh] md:h-[65vh] flex items-center justify-center z-30">
        {MOVIES.map((movie, index) => {
          const pos = getPosition(index);
          
          let translateX = 0;
          let scale = 1;
          let blur = '0px';
          let opacity = 1;
          let zIndex = 20;

          if (pos === 'center') {
            translateX = 0;
            scale = isMobile ? 1.05 : 1.15;
            blur = '0px';
            opacity = 1;
            zIndex = 40;
          } else if (pos === 'left') {
            translateX = isMobile ? -140 : -320;
            scale = isMobile ? 0.8 : 0.85;
            blur = '3px';
            opacity = 0.75;
            zIndex = 20;
          } else if (pos === 'right') {
            translateX = isMobile ? 140 : 320;
            scale = isMobile ? 0.8 : 0.85;
            blur = '3px';
            opacity = 0.75;
            zIndex = 20;
          } else {
            translateX = 0;
            scale = 0.6;
            blur = '6px';
            opacity = 0;
            zIndex = 10;
          }

          return (
            <div
              key={movie.id}
              onClick={() => {
                if (pos === 'left') handlePrev();
                if (pos === 'right') handleNext();
              }}
              className="absolute w-[220px] h-[330px] md:w-[300px] md:h-[450px] rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-[650ms] cubic-bezier(0.4, 0, 0.2, 1)"
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                filter: `blur(${blur})`,
                opacity: opacity,
                zIndex: zIndex,
              }}
            >
              <img 
                src={movie.poster} 
                alt={movie.title} 
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* 5. Details */}
      <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 z-50 max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMovie.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h2 className="font-anton text-4xl md:text-6xl uppercase tracking-wide leading-tight text-white drop-shadow-lg">
              {activeMovie.title}
            </h2>
            {!isMobile && (
              <p className="font-inter text-white/80 mt-2 text-base md:text-lg drop-shadow-md max-w-md">
                {activeMovie.synopsis}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 6. Action Link */}
      <div className="absolute bottom-8 right-6 md:bottom-12 md:right-12 z-50">
        <button 
          onClick={() => onBookTickets(activeMovie.title)}
          className="group flex items-center gap-3 bg-white text-black px-7 py-4 md:px-9 md:py-5 rounded-xl font-anton text-xl md:text-2xl uppercase tracking-wider hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-2xl cursor-pointer"
        >
          <span>Book Tickets</span>
          <ArrowRight className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
}
