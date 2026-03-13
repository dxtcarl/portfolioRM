import React from 'react';
import { motion } from 'framer-motion';

export default function WorkExperience({ experiences = [] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  if (!experiences || experiences.length === 0) return null;

  return (
    <section id="experience" className="relative py-32 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-5%">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20"
        >
          <div>
            <span className="section-label">History</span>
          </div>
          <div className="lg:col-span-3">
            <h2 className="section-title text-dark-50">Work<br />Experience</h2>
          </div>
        </motion.div>

        {/* Experience Entries */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="space-y-0"
        >
          {experiences.map((exp, i) => (
            <motion.div
              key={exp._id}
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-16 border-t border-dark-700 first:border-t-0"
            >
              {/* Date column */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-1">
                  {exp.startDate && (
                    <p className="mono text-xs tracking-widest uppercase text-dark-400">
                      {exp.startDate}
                    </p>
                  )}
                  {exp.endDate && (
                    <>
                      <p className="mono text-xs text-dark-600">—</p>
                      <p className="mono text-xs tracking-widest uppercase text-dark-400">
                        {exp.endDate}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Content column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Title */}
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bebas tracking-widest text-dark-50 uppercase leading-tight">
                    {exp.title}
                  </h3>
                  <p className="mono text-xs tracking-widest uppercase text-accent-400 mt-2">
                    {exp.company}
                  </p>
                </div>

                {/* Bullet points */}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="space-y-3">
                    {exp.bullets.map((bullet, bi) => (
                      bullet.trim() && (
                        <li key={bi} className="flex gap-4 text-dark-400 text-sm leading-relaxed">
                          <span className="text-accent-500 mt-1 flex-shrink-0">→</span>
                          <span>{bullet}</span>
                        </li>
                      )
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}