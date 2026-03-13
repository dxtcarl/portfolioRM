import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const tools = [
  {
    name: 'Photoshop',
    abbr: 'Ps',
    color: '#31A8FF',
    bg: '#001e36',
  },
  {
    name: 'Illustrator',
    abbr: 'Ai',
    color: '#FF9A00',
    bg: '#1a0a00',
  },
  {
    name: 'InDesign',
    abbr: 'Id',
    color: '#FF3366',
    bg: '#1a0010',
  },
  {
    name: 'Premiere Pro',
    abbr: 'Pr',
    color: '#9999FF',
    bg: '#0a0029',
  },
  {
    name: 'After Effects',
    abbr: 'Ae',
    color: '#9999FF',
    bg: '#00005b',
  },
  {
    name: 'XD',
    abbr: 'Xd',
    color: '#FF61F6',
    bg: '#2b0030',
  },
  {
    name: 'Lightroom',
    abbr: 'Lr',
    color: '#31A8FF',
    bg: '#001a2e',
  },
  {
    name: 'Acrobat',
    abbr: 'Ac',
    color: '#FF0000',
    bg: '#2b0000',
  },
];

export default function ScrollingTools() {
  const [scrollY, setScrollY] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Rotation based on scroll
  const rotation = scrollY * 0.3;

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Scroll indicator line top */}
      <div style={{
        width: '1px',
        height: '40px',
        background: 'linear-gradient(to bottom, transparent, #d4a34a44)',
      }} />

      {tools.map((tool, i) => (
        <div key={tool.name} style={{ position: 'relative' }}>
          {/* Tooltip */}
          {tooltip === i && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                position: 'absolute',
                right: '48px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#111',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '4px 10px',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: tool.color,
              }}
            >
              {tool.name}
            </motion.div>
          )}

          <motion.div
            onMouseEnter={() => setTooltip(i)}
            onMouseLeave={() => setTooltip(null)}
            animate={{
              rotate: rotation + i * 45,
            }}
            transition={{ type: 'tween', ease: 'linear', duration: 0 }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: tool.bg,
              border: `1px solid ${tool.color}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'none',
              flexShrink: 0,
            }}
            whileHover={{
              scale: 1.2,
              rotate: 0,
              border: `1px solid ${tool.color}`,
              transition: { duration: 0.2 },
            }}
          >
            <span style={{
              fontFamily: 'sans-serif',
              fontWeight: 700,
              fontSize: '11px',
              color: tool.color,
              letterSpacing: '-0.02em',
              userSelect: 'none',
            }}>
              {tool.abbr}
            </span>
          </motion.div>
        </div>
      ))}

      {/* Scroll indicator line bottom */}
      <div style={{
        width: '1px',
        height: '40px',
        background: 'linear-gradient(to bottom, #d4a34a44, transparent)',
      }} />
    </div>
  );
}