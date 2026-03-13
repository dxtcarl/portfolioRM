import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Carousel({ photos }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const photosRef = useRef(photos);

  // Keep ref in sync so interval always has latest photos.length without re-registering
  useEffect(() => { photosRef.current = photos; }, [photos]);

  const paginate = (newDirection, from) => {
    const len = photosRef.current.length;
    setDirection(newDirection);
    setCurrent((prev) => {
      const base = from !== undefined ? from : prev;
      return (base + newDirection + len) % len;
    });
  };

  // ✅ Single interval, never re-registers — truly infinite on ALL sections
  useEffect(() => {
    if (!photos || photos.length <= 1) return;
    const timer = setInterval(() => {
      if (!isPaused) {
        const len = photosRef.current.length;
        setDirection(1);
        setCurrent((prev) => (prev + 1) % len);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, photos.length]); // only re-register if paused state or photo count changes

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir) => ({ zIndex: 0, x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="rounded-lg border border-dark-700 p-12 text-center bg-dark-900">
        <p className="text-dark-400 font-mono text-xs uppercase tracking-widest">No photos available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1900px] mx-auto">
      <div
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative overflow-hidden rounded-lg border border-dark-700 bg-dark-900 aspect-[19/5] w-full">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={photos[current].url}
                alt={photos[current].title || 'Portfolio Work'}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {photos.length > 1 && (
            <>
              <button
                onClick={() => paginate(-1)}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-dark-950/40 backdrop-blur-md border border-white/5 text-white hover:text-accent-400 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => paginate(1)}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-dark-950/40 backdrop-blur-md border border-white/5 text-white hover:text-accent-400 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Progress bar — resets on each slide */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-20">
            <motion.div
              key={`bar-${current}-${isPaused}`}
              className="h-full bg-accent-500/50"
              initial={{ width: '0%' }}
              animate={{ width: isPaused ? '0%' : '100%' }}
              transition={isPaused ? { duration: 0 } : { duration: 5, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Captions */}
        <motion.div
          key={`text-${current}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="space-y-1">
            <h3 className="text-2xl font-light tracking-tight text-white uppercase italic font-serif">
              {photos[current].title}
            </h3>
            <p className="text-dark-400 text-sm max-w-2xl leading-relaxed">
              {photos[current].description}
            </p>
          </div>

          <div className="flex gap-3 pb-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-1 transition-all duration-500 rounded-full ${
                  i === current ? 'w-12 bg-accent-500' : 'w-4 bg-dark-700 hover:bg-dark-500'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}