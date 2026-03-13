import React, { useEffect, useState } from 'react';

export default function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onOver = (e) => {
      if (e.target.closest('a, button, [role="button"], input, textarea, select')) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver);

    const style = document.createElement('style');
    style.id = 'hide-cursor';
    style.textContent = '* { cursor: none !important; }';
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.getElementById('hide-cursor')?.remove();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        pointerEvents: 'none',
        zIndex: 99999,
        transform: `translate(-50%, -50%) scale(${clicking ? 0.7 : hovering ? 1.5 : 1})`,
        transition: 'transform 0.15s ease',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        {/* Simple diamond */}
        <polygon
          points="10,1 19,10 10,19 1,10"
          fill={hovering ? '#d4a34a' : 'none'}
          stroke="#d4a34a"
          strokeWidth="1.5"
        />
        {/* Center dot */}
        <circle cx="10" cy="10" r="1.5" fill="#d4a34a" />
      </svg>
    </div>
  );
}