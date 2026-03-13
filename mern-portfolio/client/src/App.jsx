import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Cursor from './components/Cursor';
import ScrollingTools from './components/ScrollingTools';

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="min-h-screen bg-dark-950">
      <Cursor />
      <ScrollingTools />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {token && <Route path="/admin" element={<Admin />} />}
        {!token && <Route path="/admin" element={<Admin />} />}
      </Routes>
    </div>
  );
}
