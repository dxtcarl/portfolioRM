import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { login } from '../api/auth';
import { listPhotos, uploadPhoto, deletePhoto, updatePhoto } from '../api/photos';
import { getSection, saveSection } from '../api/sections';
import { listExperiences, createExperience, updateExperience, deleteExperience } from '../api/experiences';
import { useAuthStore } from '../store/auth';
import { uploadImage } from '../api/upload';

const sectionLabel = (section) => {
  const map = { section1: 'S1', section2: 'S2', section3: 'S3', section4: 'S4' };
  return map[section] || 'S1';
};

// Blank experience template
const blankExp = { title: '', company: '', startDate: '', endDate: '', bullets: [''] };

export default function Admin() {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const logout = useAuthStore((state) => state.logout);

  const [photos, setPhotos] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [meta, setMeta] = useState({ title: '', description: '', section: 'section1' });
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [savingSection, setSavingSection] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [pendingUpdates, setPendingUpdates] = useState({});

  // Experience form state
  const [newExp, setNewExp] = useState(blankExp);
  const [savingExp, setSavingExp] = useState(false);
  const [editingExp, setEditingExp] = useState(null); // id of experience being edited
  const [editExpData, setEditExpData] = useState({});

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [previewUrl, profilePreview]);

const loadData = async () => {
  try {
    setLoading(true);

    // ✅ allSettled — one failure won't kill the rest
    const [photosResult, expResult] = await Promise.allSettled([
      listPhotos(),
      listExperiences(),
    ]);

    if (photosResult.status === 'fulfilled') {
      setPhotos(photosResult.value);
    } else {
      console.error('Photos failed:', photosResult.reason);
    }

    if (expResult.status === 'fulfilled') {
      setExperiences(expResult.value);
    } else {
      // Don't crash — /api/experiences may not be registered yet
      console.warn('Experiences failed (check route registration):', expResult.reason);
    }

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
    toast.error('Failed to load data');
    console.error('loadData error:', e);
  } finally {
    setLoading(false);
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token } = await login(creds.email, creds.password);
      setToken(token);
      toast.success('Logged in successfully');
      setCreds({ email: '', password: '' });
    } catch (e) {
      toast.error('Invalid credentials');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Select an image first');
    setUploading(true);
    try {
      const newPhoto = await uploadPhoto(file, meta.title, meta.description, meta.section);
      setPhotos((prev) => [newPhoto, ...prev]);
      setFile(null);
      setPreviewUrl(null);
      setMeta({ title: '', description: '', section: 'section1' });
      toast.success('Photo uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed — check console for details');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setProfileFile(selected);
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview(URL.createObjectURL(selected));
  };

  const handleProfileUpload = async () => {
    if (!profileFile) return toast.error('Select a profile photo first');
    setUploadingProfile(true);
    try {
      const url = await uploadImage(profileFile);
      const saved = await saveSection('about-photo', { title: 'Profile Photo', content: url });
      setSections((prev) => ({ ...prev, 'about-photo': saved }));
      setProfileFile(null);
      setProfilePreview(null);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Profile photo upload failed');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p._id !== id));
      setPendingUpdates((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success('Photo deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  const handlePhotoFieldChange = (id, field, value) => {
    setPendingUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
    setPhotos((prev) => prev.map((p) => (p._id === id ? { ...p, [field]: value } : p)));
  };

  const handleSavePhoto = async (id) => {
    const fields = pendingUpdates[id];
    if (!fields || Object.keys(fields).length === 0) return;
    try {
      const updated = await updatePhoto(id, fields);
      setPhotos((prev) => prev.map((p) => (p._id === id ? updated : p)));
      setPendingUpdates((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success('Photo updated');
    } catch (e) { toast.error('Update failed'); }
  };

  const handleSaveSection = async (key) => {
    setSavingSection(key);
    try {
      const sec = sections[key];
      const saved = await saveSection(key, { title: sec.title, content: sec.content });
      setSections((prev) => ({ ...prev, [key]: saved }));
      toast.success('Saved');
    } catch (e) { toast.error('Save failed'); }
    finally { setSavingSection(null); }
  };

  const handleSaveMultiple = async (keys) => {
    setSavingSection(keys[0]);
    try {
      for (const key of keys) {
        const sec = sections[key];
        const saved = await saveSection(key, { title: sec.title, content: sec.content });
        setSections((prev) => ({ ...prev, [key]: saved }));
      }
      toast.success('All changes saved');
    } catch (e) { toast.error('Save failed'); }
    finally { setSavingSection(null); }
  };

  const updateSection = (key, field, value) => {
    setSections((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // ── Experience handlers ──

  // Update a bullet in the new experience form
  const updateNewBullet = (i, value) => {
    const bullets = [...newExp.bullets];
    bullets[i] = value;
    setNewExp({ ...newExp, bullets });
  };

  const addNewBullet = () => setNewExp({ ...newExp, bullets: [...newExp.bullets, ''] });

  const removeNewBullet = (i) => {
    const bullets = newExp.bullets.filter((_, idx) => idx !== i);
    setNewExp({ ...newExp, bullets: bullets.length ? bullets : [''] });
  };

  const handleCreateExperience = async () => {
    if (!newExp.title.trim() || !newExp.company.trim()) {
      return toast.error('Title and company are required');
    }
    setSavingExp(true);
    try {
      const created = await createExperience({
        ...newExp,
        bullets: newExp.bullets.filter((b) => b.trim()),
        order: experiences.length,
      });
      setExperiences((prev) => [created, ...prev]);
      setNewExp(blankExp);
      toast.success('Experience added');
    } catch (e) { toast.error('Failed to add experience'); }
    finally { setSavingExp(false); }
  };

  const startEditExp = (exp) => {
    setEditingExp(exp._id);
    setEditExpData({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: exp.bullets?.length ? [...exp.bullets] : [''],
    });
  };

  const updateEditBullet = (i, value) => {
    const bullets = [...editExpData.bullets];
    bullets[i] = value;
    setEditExpData({ ...editExpData, bullets });
  };

  const addEditBullet = () => setEditExpData({ ...editExpData, bullets: [...editExpData.bullets, ''] });

  const removeEditBullet = (i) => {
    const bullets = editExpData.bullets.filter((_, idx) => idx !== i);
    setEditExpData({ ...editExpData, bullets: bullets.length ? bullets : [''] });
  };

  const handleSaveExp = async (id) => {
    setSavingExp(true);
    try {
      const updated = await updateExperience(id, {
        ...editExpData,
        bullets: editExpData.bullets.filter((b) => b.trim()),
      });
      setExperiences((prev) => prev.map((e) => (e._id === id ? updated : e)));
      setEditingExp(null);
      toast.success('Experience updated');
    } catch (e) { toast.error('Update failed'); }
    finally { setSavingExp(false); }
  };

  const handleDeleteExp = async (id) => {
    if (!confirm('Delete this experience entry?')) return;
    try {
      await deleteExperience(id);
      setExperiences((prev) => prev.filter((e) => e._id !== id));
      toast.success('Experience deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  // ─── Login Screen ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md px-6">
          <div className="rounded-lg border border-dark-700 p-8 bg-dark-900">
            <h1 className="text-3xl font-bebas tracking-widest mb-2 text-dark-50">Admin Login</h1>
            <p className="text-dark-400 text-sm mb-8">Access your portfolio management panel</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block mono text-xs tracking-widest uppercase text-dark-400 mb-2">Email</label>
                <input type="email" placeholder="admin@example.com" value={creds.email}
                  onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-dark-50" required />
              </div>
              <div>
                <label className="block mono text-xs tracking-widest uppercase text-dark-400 mb-2">Password</label>
                <input type="password" placeholder="••••••••" value={creds.password}
                  onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-dark-50" required />
              </div>
              <button type="submit" className="w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors">Sign In</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
          <div>
            <h1 className="section-title text-dark-50">Admin Panel</h1>
            <p className="text-dark-400 mono text-xs tracking-widest uppercase mt-1">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} · {experiences.length} experience{experiences.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={logout} className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 hover:border-red-500 text-dark-400 hover:text-red-400 transition-colors rounded">
            Logout
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-dark-700">
          {['content', 'experience', 'photos'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`mono text-xs tracking-widest uppercase px-4 py-2 transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'border-accent-500 text-accent-400' : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 rounded-full border-2 border-dark-700 border-t-accent-500 animate-spin mx-auto mb-4" />
            <p className="text-dark-400 mono text-xs tracking-widest uppercase">Loading data…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-6">

                  {/* Hero */}
                  <SectionCard title="Hero Section" delay={0.1}>
                    <Field label="Headline">
                      <input value={sections['hero']?.content || ''} onChange={(e) => updateSection('hero', 'content', e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Descriptor">
                      <textarea rows={3} value={sections['hero']?.title || ''} onChange={(e) => updateSection('hero', 'title', e.target.value)} className={`${inputCls} resize-none`} />
                    </Field>
                    <SaveButton onClick={() => handleSaveSection('hero')} saving={savingSection === 'hero'} label="Save Hero" />
                  </SectionCard>

                  {/* About */}
                  <SectionCard title="About Section" delay={0.2}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Name">
                        <input value={sections['about']?.title || ''} onChange={(e) => updateSection('about', 'title', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Role">
                        <input value={sections['about-role']?.title || ''} onChange={(e) => updateSection('about-role', 'title', e.target.value)} className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Bio">
                      <textarea rows={4} value={sections['about']?.content || ''} onChange={(e) => updateSection('about', 'content', e.target.value)} className={`${inputCls} resize-none`} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Email">
                        <input type="email" value={sections['about-meta-email']?.content || ''} onChange={(e) => updateSection('about-meta-email', 'content', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Location">
                        <input value={sections['about-meta-location']?.content || ''} onChange={(e) => updateSection('about-meta-location', 'content', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Specialty">
                        <input value={sections['about-meta-specialty']?.content || ''} onChange={(e) => updateSection('about-meta-specialty', 'content', e.target.value)} className={inputCls} />
                      </Field>
                    </div>

                    {/* Profile Photo */}
                    <div className="pt-4 border-t border-dark-700">
                      <p className="mono text-xs tracking-widest uppercase text-accent-400 mb-3">Profile Photo</p>
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-lg border border-dark-700 bg-dark-950 overflow-hidden flex-shrink-0">
                          {(profilePreview || sections['about-photo']?.content) ? (
                            <img src={profilePreview || sections['about-photo']?.content} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-600">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center w-full h-10 rounded-lg border border-dashed border-dark-600 hover:border-accent-500 bg-dark-950 cursor-pointer transition-colors relative">
                            <span className="mono text-xs tracking-widest uppercase text-dark-400">{profileFile ? profileFile.name : 'Choose photo…'}</span>
                            <input type="file" accept="image/*" onChange={handleProfileFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </label>
                          <button onClick={handleProfileUpload} disabled={uploadingProfile || !profileFile}
                            className="w-full px-3 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors disabled:opacity-40 text-sm flex items-center justify-center gap-2">
                            {uploadingProfile ? <><span className="w-3 h-3 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />Uploading…</> : 'Upload Profile Photo'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <SaveButton
                      onClick={() => handleSaveMultiple(['about', 'about-role', 'about-meta-email', 'about-meta-location', 'about-meta-specialty'])}
                      saving={savingSection === 'about'} label="Save About"
                    />
                  </SectionCard>

                  {/* Work Sections */}
                  <SectionCard title="Work Sections" delay={0.3}>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((n) => (
                        <Field key={n} label={`Section ${n} Title`}>
                          <input
                            value={sections[`work-section-${n}-title`]?.title || ''}
                            onChange={(e) => updateSection(`work-section-${n}-title`, 'title', e.target.value)}
                            className={inputCls}
                          />
                        </Field>
                      ))}
                    </div>
                    <SaveButton
                      onClick={() => handleSaveMultiple(['work-section-1-title', 'work-section-2-title', 'work-section-3-title', 'work-section-4-title'])}
                      saving={savingSection === 'work-section-1-title'} label="Save Work Sections"
                    />
                  </SectionCard>

                  {/* Footer */}
                  <SectionCard title="Footer" delay={0.4}>
                    <Field label="Footer Text">
                      <textarea rows={2} value={sections['footer']?.content || ''} onChange={(e) => updateSection('footer', 'content', e.target.value)} className={`${inputCls} resize-none`} />
                    </Field>
                    <SaveButton onClick={() => handleSaveSection('footer')} saving={savingSection === 'footer'} label="Save Footer" />
                  </SectionCard>
                </div>

                {/* Right: Upload */}
                <div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-lg border border-dark-700 p-6 bg-dark-900 sticky top-24"
                  >
                    <h3 className="text-lg font-medium mb-4 text-accent-400">Upload Photo</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                      <Field label="Image">
                        <label className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed border-dark-600 hover:border-accent-500 bg-dark-950 cursor-pointer transition-colors overflow-hidden relative">
                          {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : (
                            <div className="flex flex-col items-center gap-2 text-dark-400">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="mono text-xs tracking-widest uppercase">Click to select</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                        {file && <p className="mt-1 mono text-xs text-dark-400 truncate">{file.name}</p>}
                      </Field>
                      <Field label="Title">
                        <input placeholder="Photo title" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Description">
                        <textarea placeholder="Photo description" rows={2} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} className={`${inputCls} resize-none`} />
                      </Field>
                      <Field label="Carousel Section">
                        <select value={meta.section} onChange={(e) => setMeta({ ...meta, section: e.target.value })} className={inputCls}>
                          <option value="section1">Section 1 — Brand Guidelines</option>
                          <option value="section2">Section 2 — Brand Presentation</option>
                          <option value="section3">Section 3 — UI/UX Projects</option>
                          <option value="section4">Section 4 — Portfolio Highlights</option>
                        </select>
                      </Field>
                      <button type="submit" disabled={uploading || !file}
                        className="w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                        {uploading ? <><span className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />Uploading…</> : 'Upload Photo'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ── EXPERIENCE TAB ── */}
            {activeTab === 'experience' && (
              <motion.div key="experience" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left: existing entries */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-dark-50 font-medium mb-6">
                    {experiences.length} Experience{experiences.length !== 1 ? 's' : ''}
                  </h2>

                  {experiences.length === 0 && (
                    <div className="text-center py-16 text-dark-500 mono text-xs tracking-widest uppercase">
                      No experience entries yet — add one →
                    </div>
                  )}

                  {experiences.map((exp) => (
                    <div key={exp._id} className="rounded-lg border border-dark-700 bg-dark-900 overflow-hidden">
                      {editingExp === exp._id ? (
                        /* ── Edit mode ── */
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Job Title">
                              <input value={editExpData.title} onChange={(e) => setEditExpData({ ...editExpData, title: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="Company">
                              <input value={editExpData.company} onChange={(e) => setEditExpData({ ...editExpData, company: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="Start Date">
                              <input placeholder="Nov 2024" value={editExpData.startDate} onChange={(e) => setEditExpData({ ...editExpData, startDate: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="End Date">
                              <input placeholder="Oct 2025 or Present" value={editExpData.endDate} onChange={(e) => setEditExpData({ ...editExpData, endDate: e.target.value })} className={inputCls} />
                            </Field>
                          </div>
                          <Field label="Bullet Points">
                            <div className="space-y-2">
                              {editExpData.bullets.map((b, i) => (
                                <div key={i} className="flex gap-2">
                                  <input value={b} onChange={(e) => updateEditBullet(i, e.target.value)}
                                    placeholder={`Bullet ${i + 1}`} className={`${inputCls} flex-1`} />
                                  <button onClick={() => removeEditBullet(i)} className="px-2 text-red-400 hover:text-red-300">✕</button>
                                </div>
                              ))}
                              <button onClick={addEditBullet} className="mono text-xs tracking-widest uppercase text-accent-400 hover:text-accent-300 transition-colors">
                                + Add bullet
                              </button>
                            </div>
                          </Field>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveExp(exp._id)} disabled={savingExp}
                              className="flex-1 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium text-sm transition-colors disabled:opacity-50">
                              {savingExp ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button onClick={() => setEditingExp(null)} className="px-4 py-2 rounded-lg border border-dark-700 text-dark-400 hover:text-dark-200 text-sm transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <div className="p-6">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-dark-50 font-medium">{exp.title}</h3>
                              <p className="mono text-xs tracking-widest uppercase text-accent-400 mt-1">{exp.company}</p>
                              {(exp.startDate || exp.endDate) && (
                                <p className="mono text-xs text-dark-500 mt-1">
                                  {exp.startDate}{exp.startDate && exp.endDate ? ' — ' : ''}{exp.endDate}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => startEditExp(exp)}
                                className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 hover:border-accent-500 text-dark-400 hover:text-accent-400 transition-colors rounded">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteExp(exp._id)}
                                className="mono text-xs tracking-widest uppercase px-3 py-1 border border-dark-700 hover:border-red-500 text-dark-400 hover:text-red-400 transition-colors rounded">
                                Delete
                              </button>
                            </div>
                          </div>
                          {exp.bullets?.length > 0 && (
                            <ul className="mt-4 space-y-1">
                              {exp.bullets.map((b, i) => (
                                <li key={i} className="flex gap-2 text-dark-500 text-xs">
                                  <span className="text-accent-600">→</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right: Add new experience */}
                <div>
                  <div className="rounded-lg border border-dark-700 p-6 bg-dark-900 sticky top-24 space-y-4">
                    <h3 className="text-lg font-medium text-accent-400">Add Experience</h3>

                    <Field label="Job Title">
                      <input placeholder="Graphic Designer | Project Manager" value={newExp.title}
                        onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Company">
                      <input placeholder="The Brandit Agency" value={newExp.company}
                        onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start">
                        <input placeholder="Nov 2024" value={newExp.startDate}
                          onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="End">
                        <input placeholder="Present" value={newExp.endDate}
                          onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })} className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Bullet Points">
                      <div className="space-y-2">
                        {newExp.bullets.map((b, i) => (
                          <div key={i} className="flex gap-2">
                            <input value={b} onChange={(e) => updateNewBullet(i, e.target.value)}
                              placeholder={`Responsibility ${i + 1}`} className={`${inputCls} flex-1`} />
                            <button onClick={() => removeNewBullet(i)} className="px-2 text-red-400 hover:text-red-300 text-sm">✕</button>
                          </div>
                        ))}
                        <button onClick={addNewBullet} className="mono text-xs tracking-widest uppercase text-accent-400 hover:text-accent-300 transition-colors">
                          + Add bullet
                        </button>
                      </div>
                    </Field>

                    <button onClick={handleCreateExperience} disabled={savingExp || !newExp.title || !newExp.company}
                      className="w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                      {savingExp ? <><span className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />Saving…</> : 'Add Experience'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PHOTOS TAB ── */}
            {activeTab === 'photos' && (
              <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {photos.length === 0 ? (
                  <div className="text-center py-24 text-dark-400">
                    <p className="mono text-xs tracking-widest uppercase">No photos yet</p>
                    <button onClick={() => setActiveTab('content')} className="mt-4 mono text-xs tracking-widest uppercase text-accent-400 hover:underline">Upload one →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((p, i) => {
                      const isDirty = !!pendingUpdates[p._id];
                      return (
                        <motion.div key={p._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          className="rounded-lg border border-dark-700 overflow-hidden bg-dark-900 group flex flex-col">
                          <div className="relative overflow-hidden h-52 bg-dark-950 flex-shrink-0">
                            <img src={p.url} alt={p.title || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            <div style={{ display: 'none' }} className="absolute inset-0 flex flex-col items-center justify-center text-dark-500 text-xs mono tracking-widest uppercase gap-2">
                              Image unavailable
                            </div>
                            <div className="absolute top-2 left-2 mono text-xs tracking-widest uppercase px-2 py-1 rounded bg-dark-950/70 backdrop-blur text-accent-400 border border-dark-700">
                              {sectionLabel(p.section)}
                            </div>
                          </div>
                          <div className="p-4 space-y-3 flex-1 flex flex-col">
                            <input value={p.title || ''} onChange={(e) => handlePhotoFieldChange(p._id, 'title', e.target.value)} placeholder="Title"
                              className="w-full px-3 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-sm text-dark-50" />
                            <textarea rows={2} value={p.description || ''} onChange={(e) => handlePhotoFieldChange(p._id, 'description', e.target.value)} placeholder="Description"
                              className="w-full px-3 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-sm text-dark-50 resize-none" />
                            <select value={p.section || 'section1'} onChange={(e) => handlePhotoFieldChange(p._id, 'section', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-sm text-dark-50">
                              <option value="section1">Section 1</option>
                              <option value="section2">Section 2</option>
                              <option value="section3">Section 3</option>
                              <option value="section4">Section 4</option>
                            </select>
                            <div className="flex gap-2 pt-1">
                              {isDirty && (
                                <button onClick={() => handleSavePhoto(p._id)} className="flex-1 px-3 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors text-sm">Save</button>
                              )}
                              <button onClick={() => handleDelete(p._id)} className={`${isDirty ? '' : 'flex-1'} px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 font-medium transition-colors text-sm`}>Delete</button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-2 rounded-lg border border-dark-700 bg-dark-950 focus:border-accent-500 focus:outline-none transition-colors text-dark-50 text-sm';

function Field({ label, children }) {
  return (
    <div>
      <label className="block mono text-xs tracking-widest uppercase text-dark-400 mb-2">{label}</label>
      {children}
    </div>
  );
}

function SectionCard({ title, delay = 0, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-lg border border-dark-700 p-6 bg-dark-900">
      <h3 className="text-lg font-medium mb-5 text-accent-400">{title}</h3>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function SaveButton({ onClick, saving, label }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-dark-950 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
      {saving ? <><span className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />Saving…</> : label}
    </button>
  );
}