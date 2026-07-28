const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');

async function createPrescription(data) {
  const { appointmentId, doctorId, patientId, diagnosis, instructions, items } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert prescription
    const presRes = await client.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, instructions)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [appointmentId, doctorId, patientId, diagnosis, instructions]
    );
    const prescription = presRes.rows[0];

    // Insert items
    const insertedItems = [];
    if (items && items.length > 0) {
      for (const item of items) {
        const itemRes = await client.query(
          `INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [prescription.id, item.medicine_name, item.dosage, item.frequency, item.duration, item.instructions]
        );
        insertedItems.push(itemRes.rows[0]);
      }
    }

    await client.query('COMMIT');
    return { ...prescription, items: insertedItems };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getPatientPrescriptions(patientId) {
  const prescriptions = await pool.query(
    `SELECT p.*, d.first_name as doc_first, d.last_name as doc_last, d.specialization
     FROM prescriptions p
     JOIN doctors d ON p.doctor_id = d.id
     WHERE p.patient_id = $1
     ORDER BY p.issued_at DESC`,
    [patientId]
  );

  const results = [];
  for (const p of prescriptions.rows) {
    const items = await pool.query(`SELECT * FROM prescription_items WHERE prescription_id = $1`, [p.id]);
    results.push({ ...p, items: items.rows });
  }
  return results;
}

module.exports = {
  createPrescription,
  getPatientPrescriptions
};
