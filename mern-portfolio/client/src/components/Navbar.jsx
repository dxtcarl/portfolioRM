import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5% bg-dark-950/85 backdrop-blur-xl border-b border-dark-700"
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="font-bebas text-2xl tracking-widest">RON MEDINA</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="mono text-xs tracking-widest uppercase text-dark-400 hover:text-accent-400 transition-colors">
            About
          </a>
          <a href="#work" className="mono text-xs tracking-widest uppercase text-dark-400 hover:text-accent-400 transition-colors">
            Work
          </a>
          {token ? (
            <>
              <Link
                to="/admin"
                className={`mono text-xs tracking-widest uppercase transition-colors ${
                  isActive('/admin') ? 'text-accent-400' : 'text-dark-400 hover:text-accent-400'
                }`}
              >
                Admin
              </Link>
              <button
                onClick={logout}
                className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 hover:border-accent-400 text-dark-400 hover:text-accent-400 transition-colors rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin"
              className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 hover:border-accent-400 text-dark-400 hover:text-accent-400 transition-colors rounded"
            >
              Admin
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-white/10 transition-colors rounded"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 bg-dark-950/95 backdrop-blur-xl border-b border-dark-700 md:hidden"
        >
          <div className="flex flex-col gap-4 p-4">
            <a href="#about" className="mono text-xs tracking-widest uppercase text-dark-400 hover:text-accent-400">
              About
            </a>
            <a href="#work" className="mono text-xs tracking-widest uppercase text-dark-400 hover:text-accent-400">
              Work
            </a>
            {token ? (
              <>
                <Link to="/admin" className="mono text-xs tracking-widest uppercase text-dark-400 hover:text-accent-400">
                  Admin
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 text-dark-400 hover:text-accent-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin" className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 text-dark-400 hover:text-accent-400">
                Admin
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
