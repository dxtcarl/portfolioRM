import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listPhotos } from '../api/photos';
import { listExperiences } from '../api/experiences';
import { getSection } from '../api/sections';
import Hero from '../components/Hero';
import About from '../components/About';
import Carousel from '../components/Carousel';
import WorkExperience from '../components/WorkExperience';

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, exp] = await Promise.all([listPhotos(), listExperiences()]);
        setPhotos(p);
        setExperiences(exp);

        const keys = [
          'hero', 'about', 'about-role', 'about-meta-email', 'about-meta-location',
          'about-meta-specialty', 'about-photo',
          'work-section-1-title', 'work-section-2-title',
          'work-section-3-title', 'work-section-4-title',
          'footer',
        ];
        const sec = {};
        for (const k of keys) {
          try { sec[k] = await getSection(k); }
          catch (e) { sec[k] = { key: k, title: '', content: '' }; }
        }
        setSections(sec);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const carousel1Photos = photos.filter((p) => p.section === 'section1');
  const carousel2Photos = photos.filter((p) => p.section === 'section2');
  const carousel3Photos = photos.filter((p) => p.section === 'section3');
  const carousel4Photos = photos.filter((p) => p.section === 'section4');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-dark-700 border-t-accent-500 animate-spin mx-auto mb-4" />
          <p className="text-dark-400 mono text-xs tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Hero data={sections['hero'] || {}} />
      <About data={sections} />

      {/* Work Section 1 */}
      <section id="work" className="relative py-32 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-5%">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start mb-12">
              <div className="sticky top-24"><span className="section-label">Selected Work</span></div>
              <h2 className="section-title text-dark-50">{sections['work-section-1-title']?.title || 'Brand Guidelines'}</h2>
            </motion.div>
            <motion.div variants={itemVariants}><Carousel photos={carousel1Photos} /></motion.div>
          </motion.div>
        </div>
      </section>

      {/* Work Section 2 */}
      <section className="relative py-32 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-5%">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start mb-12">
              <div className="sticky top-24"><span className="section-label">Selected Work</span></div>
              <h2 className="section-title text-dark-50">{sections['work-section-2-title']?.title || 'Brand Presentation'}</h2>
            </motion.div>
            <motion.div variants={itemVariants}><Carousel photos={carousel2Photos} /></motion.div>
          </motion.div>
        </div>
      </section>

      {/* Work Section 3 */}
      <section className="relative py-32 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-5%">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start mb-12">
              <div className="sticky top-24"><span className="section-label">Selected Work</span></div>
              <h2 className="section-title text-dark-50">{sections['work-section-3-title']?.title || 'UI/UX Projects'}</h2>
            </motion.div>
            <motion.div variants={itemVariants}><Carousel photos={carousel3Photos} /></motion.div>
          </motion.div>
        </div>
      </section>

      {/* Work Section 4 */}
      <section className="relative py-32 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-5%">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start mb-12">
              <div className="sticky top-24"><span className="section-label">Selected Work</span></div>
              <h2 className="section-title text-dark-50">{sections['work-section-4-title']?.title || 'Portfolio Highlights'}</h2>
            </motion.div>
            <motion.div variants={itemVariants}><Carousel photos={carousel4Photos} /></motion.div>
          </motion.div>
        </div>
      </section>

      {/* ✅ Work Experience — after all carousels */}
      <WorkExperience experiences={experiences} />

      {/* Footer */}
      <footer className="relative py-12 border-t border-dark-700">
        <div className="max-w-7xl mx-auto px-5%">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            <p className="mono text-xs tracking-widest uppercase text-dark-400">
              {sections['footer']?.content || '© 2026 Ron Medina — Bridging Design & Tech'}
            </p>
            <span className="tag">Porac, Pampanga PH</span>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}