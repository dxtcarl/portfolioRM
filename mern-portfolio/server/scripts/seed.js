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
    {
      key: 'hero',
      title: 'Simplicity.',
      content: 'Bridging visual creativity with systems thinking — from pixel to print to production.'
    },
    {
      key: 'about',
      title: "i'm\nron Medina",
      content: "I'm a creative and technically skilled professional with a passion for blending design, technology, and strategy. I bring together artistic vision and analytical thinking to create purposeful, efficient, and visually engaging work. I believe simplicity and clarity drive the best results — whether in design, systems, or collaboration."
    },
    {
      key: 'about-role',
      title: 'Creative-Tech Hybrid',
      content: ''
    },
    {
      key: 'about-meta-email',
      title: 'Email',
      content: 'ronaldramirezmedina@gmail.com'
    },
    {
      key: 'about-meta-location',
      title: 'Based in',
      content: 'Porac, Pampanga, PH'
    },
    {
      key: 'about-meta-specialty',
      title: 'Specialty',
      content: 'Design · Print · AI Systems'
    },
    {
      key: 'work-section-1-title',
      title: 'Brand Guidelines',
      content: ''
    },
    {
      key: 'work-section-2-title',
      title: 'Brand Presentation',
      content: ''
    },
    {
      key: 'work-section-3-title',
      title: 'Print & Packaging',
      content: ''
    },
    {
      key: 'work-section-4-title',
      title: 'AI-Generated Concepts',
      content: ''
    },
    {
      key: 'footer',
      title: 'Footer',
      content: '© 2026 Ron Medina — Bridging Design & Tech'
    }
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
