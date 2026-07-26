const { pool } = require('./src/config/database');
const id = 'f0728b18-5e55-4ad4-bdbd-7fb7139c11e7';
const q = `
  SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.consultation_fee, d.is_available,
         u.email, u.profile_picture_url
  FROM doctors d
  JOIN users u ON d.user_id = u.id
  WHERE d.hospital_id = $1
  ORDER BY d.first_name, d.last_name
`;
pool.query(q, [id])
  .then(r => console.log('Rows:', r.rows.length))
  .catch(err => console.error('Error:', err.message))
  .finally(() => process.exit(0));
