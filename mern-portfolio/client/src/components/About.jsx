import React from 'react';
import { motion } from 'framer-motion';

export default function About({ data }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const profilePhoto = data['about-photo']?.content;

  return (
    <section id="about" className="relative py-32 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-5%">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-16 items-start"
        >
          {/* Profile Photo */}
          <motion.div variants={itemVariants}>
            <div className="sticky top-24 rounded-lg overflow-hidden border border-dark-700 bg-dark-900 w-full aspect-[3/4]">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={data['about']?.title || 'Profile'}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                style={{ display: profilePhoto ? 'none' : 'flex' }}
                className="w-full h-full flex flex-col items-center justify-center text-dark-600 gap-3"
              >
                <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="mono text-xs tracking-widest uppercase text-dark-500">No profile photo set</p>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={containerVariants} className="flex flex-col justify-center space-y-8 lg:py-8 lg:min-h-full">

            {/* Name + Role */}
            <motion.div variants={itemVariants}>
              <h2 className="section-title mb-2 text-dark-50">
                {data['about']?.title || "I'M RON MEDINA"}
              </h2>
              <p className="mono text-xs tracking-widest uppercase text-accent-400">
                {data['about-role']?.title || 'Creative-Tech Hybrid'}
              </p>
            </motion.div>

            {/* Bio */}
            <motion.p variants={itemVariants} className="text-dark-400 text-base leading-relaxed">
              {data['about']?.content || "I'm a creative and technically skilled professional..."}
            </motion.p>

            {/* Meta Info — fixed alignment with consistent grid */}
            <motion.div variants={itemVariants} className="pt-8 border-t border-dark-700">
              <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-5">
                <dt className="mono text-xs tracking-widest uppercase text-dark-500 self-center whitespace-nowrap">Email</dt>
                <dd className="text-dark-100 text-sm">{data['about-meta-email']?.content || 'contact@example.com'}</dd>

                <dt className="mono text-xs tracking-widest uppercase text-dark-500 self-center whitespace-nowrap">Based in</dt>
                <dd className="text-dark-100 text-sm">{data['about-meta-location']?.content || 'Location'}</dd>

                <dt className="mono text-xs tracking-widest uppercase text-dark-500 self-center whitespace-nowrap">Specialty</dt>
                <dd className="text-accent-400 text-sm">{data['about-meta-specialty']?.content || 'Design · Tech'}</dd>
              </dl>
            </motion.div>

          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}