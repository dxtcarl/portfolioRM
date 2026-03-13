# Creates MERN portfolio project structure and files
param()

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

# Directories
$dirs = @(
  (Join-Path $Root 'server/src/config'),
  (Join-Path $Root 'server/src/models'),
  (Join-Path $Root 'server/src/routes'),
  (Join-Path $Root 'server/src/middleware'),
  (Join-Path $Root 'server/scripts'),
  (Join-Path $Root 'server/uploads'),
  (Join-Path $Root 'client/src/api'),
  (Join-Path $Root 'client/src/pages'),
  (Join-Path $Root 'client/src/components')
)
foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }

# ----------------- SERVER FILES -----------------
Write-File -Path (Join-Path $Root 'server/package.json') -Content @'
{
  "name": "mern-portfolio-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.3.4",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
'@

Write-File -Path (Join-Path $Root 'server/.env.example') -Content @'
PORT=5000
MONGO_URI=mongodb://localhost:27017/portfolio
JWT_SECRET=change_me_please
ADMIN_EMAIL=admin@example.com
# Generate a bcrypt hash for your password:
# node -e "console.log(require('bcrypt').hashSync('yourpassword', 10))"
ADMIN_PASSWORD_HASH=$2b$10$replace_with_hash
CLIENT_ORIGIN=http://localhost:5173
'@

Write-File -Path (Join-Path $Root 'server/.gitignore') -Content @'
node_modules
.env
uploads/*
'@

Write-File -Path (Join-Path $Root 'server/src/index.js') -Content @'
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');
const sectionRoutes = require('./routes/sections');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/sections', sectionRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve built client in production if available
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect DB', err);
    process.exit(1);
  });
'@

Write-File -Path (Join-Path $Root 'server/src/config/db.js') -Content @'
const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
'@

Write-File -Path (Join-Path $Root 'server/src/middleware/auth.js') -Content @'
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = { id: payload.sub || 'admin' };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
'@

Write-File -Path (Join-Path $Root 'server/src/middleware/upload.js') -Content @'
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ok = /image\/(png|jpe?g|gif|webp|svg\+xml)/.test(file.mimetype);
  cb(ok ? null : new Error('Only image files are allowed'), ok);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
'@

Write-File -Path (Join-Path $Root 'server/src/models/Photo.js') -Content @'
const { Schema, model } = require('mongoose');

const photoSchema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = model('Photo', photoSchema);
'@

Write-File -Path (Join-Path $Root 'server/src/models/Section.js') -Content @'
const { Schema, model } = require('mongoose');

const sectionSchema = new Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' }
}, { timestamps: true });

module.exports = model('Section', sectionSchema);
'@

Write-File -Path (Join-Path $Root 'server/src/routes/auth.js') -Content @'
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return res.status(500).json({ error: 'Admin credentials not configured' });
  if (email !== adminEmail) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', adminHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: 'admin', email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
'@

Write-File -Path (Join-Path $Root 'server/src/routes/photos.js') -Content @'
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const photos = await Photo.find().sort({ createdAt: -1 }).lean();
  res.json(photos);
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const filename = req.file.filename;
  const url = `/uploads/${filename}`;
  const { title = '', description = '' } = req.body || {};
  const photo = await Photo.create({ filename, url, title, description });
  res.status(201).json(photo);
});

router.patch('/:id', auth, async (req, res) => {
  const { title, description } = req.body || {};
  const photo = await Photo.findByIdAndUpdate(req.params.id, { $set: { title, description } }, { new: true });
  if (!photo) return res.status(404).json({ error: 'Not found' });
  res.json(photo);
});

router.delete('/:id', auth, async (req, res) => {
  const photo = await Photo.findByIdAndDelete(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(__dirname, '..', 'uploads', photo.filename);
  fs.promises.unlink(filePath).catch(() => {});
  res.json({ success: true });
});

module.exports = router;
'@

Write-File -Path (Join-Path $Root 'server/src/routes/sections.js') -Content @'
const router = require('express').Router();
const Section = require('../models/Section');
const auth = require('../middleware/auth');

router.get('/:key', async (req, res) => {
  const key = req.params.key;
  const section = await Section.findOne({ key }).lean();
  if (!section) return res.status(404).json({ error: 'Not found' });
  res.json(section);
});

router.put('/:key', auth, async (req, res) => {
  const key = req.params.key;
  const { title = '', content = '' } = req.body || {};
  const section = await Section.findOneAndUpdate(
    { key },
    { $set: { title, content } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(section);
});

module.exports = router;
'@

Write-File -Path (Join-Path $Root 'server/scripts/seed.js') -Content @'
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/config/db');
const Photo = require('../src/models/Photo');
const Section = require('../src/models/Section');

(async () => {
  await connectDB();
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const sourceDir = path.join(__dirname, '..', '..', '..', 'img');
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir).filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f));
    console.log(`Found ${files.length} images in ${sourceDir}`);
    for (const file of files) {
      const dest = path.join(uploadsDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(sourceDir, file), dest);
      }
      const exists = await Photo.findOne({ filename: file });
      if (!exists) {
        await Photo.create({
          filename: file,
          url: `/uploads/${file}`,
          title: path.basename(file, path.extname(file)),
          description: ''
        });
        console.log(`Imported ${file}`);
      }
    }
  } else {
    console.log('Source images directory not found, skipping photo import.');
  }

  const defaults = [
    { key: 'hero', title: 'Welcome', content: 'This is my portfolio.' },
    { key: 'about', title: 'About Me', content: 'Short bio here.' },
    { key: 'contact', title: 'Contact', content: 'Your contact details here.' }
  ];
  for (const s of defaults) {
    const exists = await Section.findOne({ key: s.key });
    if (!exists) {
      await Section.create(s);
      console.log(`Created section ${s.key}`);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
'@

# ----------------- CLIENT FILES -----------------
Write-File -Path (Join-Path $Root 'client/package.json') -Content @'
{
  "name": "mern-portfolio-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.2.6"
  }
}
'@

Write-File -Path (Join-Path $Root 'client/vite.config.js') -Content @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
});
'@

Write-File -Path (Join-Path $Root 'client/.env.example') -Content @'
VITE_API_URL=http://localhost:5000
'@

Write-File -Path (Join-Path $Root 'client/index.html') -Content @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Portfolio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@

Write-File -Path (Join-Path $Root 'client/src/main.jsx') -Content @'
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
'@

Write-File -Path (Join-Path $Root 'client/src/App.jsx') -Content @'
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '0 auto', maxWidth: 1000, padding: '1rem' }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
'@

Write-File -Path (Join-Path $Root 'client/src/api/client.js') -Content @'
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
'@

Write-File -Path (Join-Path $Root 'client/src/api/auth.js') -Content @'
import api from './client';

export const login = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
};
'@

Write-File -Path (Join-Path $Root 'client/src/api/photos.js') -Content @'
import api from './client';

export const listPhotos = async () => {
  const { data } = await api.get('/api/photos');
  return data;
};

export const uploadPhoto = async (file, title, description) => {
  const form = new FormData();
  form.append('image', file);
  form.append('title', title || '');
  form.append('description', description || '');
  const { data } = await api.post('/api/photos', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const updatePhoto = async (id, fields) => {
  const { data } = await api.patch(`/api/photos/${id}`, fields);
  return data;
};

export const deletePhoto = async (id) => {
  const { data } = await api.delete(`/api/photos/${id}`);
  return data;
};
'@

Write-File -Path (Join-Path $Root 'client/src/api/sections.js') -Content @'
import api from './client';

export const getSection = async (key) => {
  const { data } = await api.get(`/api/sections/${key}`);
  return data;
};

export const saveSection = async (key, payload) => {
  const { data } = await api.put(`/api/sections/${key}`, payload);
  return data;
};
'@

Write-File -Path (Join-Path $Root 'client/src/pages/Home.jsx') -Content @'
import React, { useEffect, useState } from 'react';
import { listPhotos } from '../api/photos';
import { getSection } from '../api/sections';

export default function Home() {
  const [photos, setPhotos] = useState([]);
  const [about, setAbout] = useState(null);

  useEffect(() => {
    listPhotos().then(setPhotos).catch(console.error);
    getSection('about').then(setAbout).catch(() => setAbout(null));
  }, []);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1>{about?.title || 'My Portfolio'}</h1>
        <p>{about?.content || 'Welcome to my portfolio. Use the Admin page to edit this content.'}</p>
      </header>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {photos.map(p => (
          <figure key={p._id} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 8 }}>
            <img src={`${apiBase}${p.url}`} alt={p.title} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 4 }} />
            <figcaption>
              <strong>{p.title}</strong>
              <p style={{ margin: '4px 0 0' }}>{p.description}</p>
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
'@

Write-File -Path (Join-Path $Root 'client/src/pages/Admin.jsx') -Content @'
import React, { useEffect, useState } from 'react';
import { login } from '../api/auth';
import { listPhotos, uploadPhoto, deletePhoto, updatePhoto } from '../api/photos';
import { getSection, saveSection } from '../api/sections';

export default function Admin() {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ title: '', description: '' });
  const [about, setAbout] = useState({ title: '', content: '' });

  useEffect(() => {
    if (authed) {
      listPhotos().then(setPhotos);
      getSection('about').then(s => setAbout({ title: s.title || '', content: s.content || '' })).catch(()=>{});
    }
  }, [authed]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token } = await login(creds.email, creds.password);
      localStorage.setItem('token', token);
      setAuthed(true);
    } catch (e) {
      alert('Login failed');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Select an image.');
    const p = await uploadPhoto(file, meta.title, meta.description);
    setPhotos([p, ...photos]);
    setFile(null);
    setMeta({ title: '', description: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this photo?')) return;
    await deletePhoto(id);
    setPhotos(photos.filter(p => p._id !== id));
  };

  const handleUpdate = async (id, fields) => {
    const updated = await updatePhoto(id, fields);
    setPhotos(photos.map(p => p._id === id ? updated : p));
  };

  const saveAbout = async (e) => {
    e.preventDefault();
    const saved = await saveSection('about', about);
    setAbout({ title: saved.title, content: saved.content });
    alert('Saved');
  };

  if (!authed) {
    return (
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <h2>Admin Login</h2>
        <input placeholder="Email" value={creds.email} onChange={e=>setCreds({...creds, email: e.target.value})}/>
        <input type="password" placeholder="Password" value={creds.password} onChange={e=>setCreds({...creds, password: e.target.value})}/>
        <button type="submit">Login</button>
      </form>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h2>Upload Photo</h2>
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: 8 }}>
          <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/>
          <input placeholder="Title" value={meta.title} onChange={e=>setMeta({...meta, title: e.target.value})}/>
          <textarea placeholder="Description" value={meta.description} onChange={e=>setMeta({...meta, description: e.target.value})}/>
          <button type="submit">Upload</button>
        </form>
      </section>

      <section>
        <h2>Edit About Section</h2>
        <form onSubmit={saveAbout} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Title" value={about.title} onChange={e=>setAbout({...about, title: e.target.value})}/>
          <textarea rows="4" placeholder="Content" value={about.content} onChange={e=>setAbout({...about, content: e.target.value})}/>
          <button type="submit">Save</button>
        </form>
      </section>

      <section>
        <h2>Photos</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {photos.map(p => (
            <div key={p._id} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p.url}`} alt={p.title} style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 4 }}/>
                <div style={{ flex: 1, display: 'grid', gap: 6 }}>
                  <input value={p.title} onChange={e=>handleUpdate(p._id, { title: e.target.value })}/>
                  <textarea rows="2" value={p.description} onChange={e=>handleUpdate(p._id, { description: e.target.value })}/>
                </div>
                <button onClick={()=>handleDelete(p._id)} style={{ alignSelf: 'start' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
'@

# ----------------- ROOT README -----------------
Write-File -Path (Join-Path $Root 'README.md') -Content @'
# MERN Portfolio

This project converts your static portfolio into a MERN app with:
- Photo uploads (stored on disk under `server/uploads`)
- Editable sections (e.g., About)
- Minimal admin auth via JWT (single admin from `.env`)

## Structure
- `server/` Node/Express + MongoDB API
- `client/` React (Vite) frontend

## Setup
1) Server env
```
copy server/.env.example server/.env
# Edit server/.env: set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
# To generate a password hash:
# node -e "console.log(require('bcrypt').hashSync('yourpassword', 10))"
```

2) Install dependencies
```
cd server && npm install
cd ../client && npm install
```

3) (Optional) Seed photos from your existing `img/` folder and create default sections
```
cd server
node scripts/seed.js
```

4) Run in development
- API: `npm run dev` (in `server/`)
- Frontend: `npm run dev` (in `client/`)

Frontend dev server: http://localhost:5173
API: http://localhost:5000

Set `client/.env` with `VITE_API_URL=http://localhost:5000` (already in `.env.example`).

## Production build (single deployment)
- Build frontend: `cd client && npm run build`
- Ensure server serves `client/dist` (already configured)
- Start server: `cd ../server && npm run start`

Uploads are served from `/uploads`.
'@

Write-File -Path (Join-Path $Root '.gitignore') -Content @'
node_modules
.DS_Store
'@

Write-File -Path (Join-Path $Root 'DONE.txt') -Content 'Scaffold complete.'

Write-Output "Scaffold files created in: $Root"