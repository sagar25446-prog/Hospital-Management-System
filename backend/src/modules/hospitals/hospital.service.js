const { pool } = require('../../config/database.js');

async function getAllHospitals(search = '', city = '', specialty = '', limit = 50, offset = 0) {
  let query = `
    SELECT DISTINCT h.* 
    FROM hospitals h
  `;
  
  if (specialty) {
    query += ` JOIN doctors d ON h.id = d.hospital_id`;
  }
  
  query += ` WHERE 1=1`;
  
  const params = [];
  let paramIdx = 1;

  if (search) {
    // Use multiple ILIKE patterns to handle typos and partial matches
    // e.g. "aims" matches "AIIMS", "apolo" matches "Apollo"
    query += ` AND (h.name ILIKE $${paramIdx} OR h.name ILIKE $${paramIdx + 1} OR h.city ILIKE $${paramIdx})`;
    params.push(`%${search}%`, `%${search.replace(/\s+/g, '%')}%`);
    paramIdx += 2;
  }
  if (city) {
    query += ` AND h.city ILIKE $${paramIdx}`;
    params.push(`%${city}%`);
    paramIdx++;
  }
  if (specialty) {
    query += ` AND d.specialization ILIKE $${paramIdx}`;
    params.push(`%${specialty}%`);
    paramIdx++;
  }

  query += ` ORDER BY h.rating DESC, h.name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limit, offset);

  const { rows } = await pool.query(query, params);
  return rows;
}

async function getHospitalById(id) {
  const { rows } = await pool.query('SELECT * FROM hospitals WHERE id = $1', [id]);
  return rows[0];
}

async function getDoctorsByHospitalId(hospitalId) {
  const query = `
    SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification, d.consultation_fee, d.is_available,
           u.email, u.avatar_url as profile_picture_url
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.hospital_id = $1
    ORDER BY d.first_name, d.last_name
  `;
  const { rows } = await pool.query(query, [hospitalId]);
  return rows;
}

async function getDistinctCities() {
  const { rows } = await pool.query('SELECT DISTINCT city FROM hospitals ORDER BY city');
  return rows.map(r => r.city);
}

async function getDistinctSpecialties() {
  const { rows } = await pool.query('SELECT DISTINCT specialization FROM doctors ORDER BY specialization');
  return rows.map(r => r.specialization);
}

module.exports = {
  getAllHospitals,
  getHospitalById,
  getDoctorsByHospitalId,
  getDistinctCities,
  getDistinctSpecialties
};

