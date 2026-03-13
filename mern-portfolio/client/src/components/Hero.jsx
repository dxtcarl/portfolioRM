import React from 'react';
import { motion } from 'framer-motion';

export default function Hero({ data }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  return (
    <section className="relative min-h-screen flex items-end justify-center overflow-hidden pt-20 pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950/50"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-5% w-full"
      >
        <motion.p variants={itemVariants} className="eyebrow mb-6">
          Portfolio — 2026
        </motion.p>

        <motion.h1 variants={itemVariants} className="headline mb-10 text-dark-50">
          {data.content || 'Simplicity.'}
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="flex items-end justify-between gap-8 flex-wrap"
        >
          <p className="text-dark-400 max-w-md text-sm leading-relaxed">
            {data.title || 'Bridging visual creativity with systems thinking — from pixel to print to production.'}
          </p>
          <motion.p
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mono text-xs tracking-widest uppercase text-dark-400 flex items-center gap-3 scroll-hint"
          >
            Scroll to explore
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
