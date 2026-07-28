require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { pool } = require('./src/config/database');

const IMAGES = [
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&h=600&fit=crop',
];

async function run() {
  const { rows } = await pool.query('SELECT id, name FROM hospitals ORDER BY name');
  console.log(`Found ${rows.length} hospitals. Updating images...`);
  for (let i = 0; i < rows.length; i++) {
    const img = IMAGES[i % IMAGES.length];
    await pool.query('UPDATE hospitals SET image_url = $1 WHERE id = $2', [img, rows[i].id]);
    console.log(`  ✓ ${rows[i].name} → image ${(i % IMAGES.length) + 1}`);
  }
  console.log('Done!');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
