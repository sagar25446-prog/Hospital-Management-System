/**
 * Development seed script.
 * Creates:
 * - 1 admin user
 * - 1 doctor user + doctor profile
 * - 2 patient users + patient profiles
 * - Today's doctor_daily_queue row for the doctor
 * - 3 queue_tokens (token_number 1, 2, 3) with current_token_number = 1
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const BCRYPT_ROUNDS = 10;

async function upsertUser(client, { email, password, role }) {
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const insert = await client.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
     RETURNING id`,
    [email, password_hash, role]
  );
  return insert.rows[0].id;
}

async function main() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const queueDate = `${y}-${m}-${day}`; // Local YYYY-MM-DD
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin
    const adminUserId = await upsertUser(client, {
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin',
    });

    // Doctor user + profile
    const doctorUserId = await upsertUser(client, {
      email: 'doctor@hospital.com',
      password: 'doctor123',
      role: 'doctor',
    });

    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             specialization = EXCLUDED.specialization
       RETURNING id`,
      [doctorUserId, 'Dr', 'Sharma', 'Cardiology', 'MD', 0]
    );
    const doctorId = doctorResult.rows[0].id;

    // Three patients
    const patient1UserId = await upsertUser(client, {
      email: 'patient1@hospital.com',
      password: 'patient123',
      role: 'patient',
    });
    const patient2UserId = await upsertUser(client, {
      email: 'patient2@hospital.com',
      password: 'patient123',
      role: 'patient',
    });
    const patient3UserId = await upsertUser(client, {
      email: 'patient3@hospital.com',
      password: 'patient123',
      role: 'patient',
    });

    const patient1Result = await client.query(
      `INSERT INTO patients (user_id, first_name, last_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name
       RETURNING id`,
      [patient1UserId, 'Patient', 'One']
    );
    const patient2Result = await client.query(
      `INSERT INTO patients (user_id, first_name, last_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name
       RETURNING id`,
      [patient2UserId, 'Patient', 'Two']
    );
    const patient3Result = await client.query(
      `INSERT INTO patients (user_id, first_name, last_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name
       RETURNING id`,
      [patient3UserId, 'Patient', 'Three']
    );

    const patient1Id = patient1Result.rows[0].id;
    const patient2Id = patient2Result.rows[0].id;
    const patient3Id = patient3Result.rows[0].id;

    // doctor_daily_queue row for today
    await client.query(
      `INSERT INTO doctor_daily_queue (doctor_id, queue_date, current_token_number, last_token_number)
       VALUES ($1, $2, 1, 3)
       ON CONFLICT (doctor_id, queue_date) DO UPDATE
         SET current_token_number = EXCLUDED.current_token_number,
             last_token_number = EXCLUDED.last_token_number,
             updated_at = NOW()`,
      [doctorId, queueDate]
    );

    // Basic cleanup: remove any existing tokens for this doctor/date to avoid duplicates
    await client.query(
      `DELETE FROM queue_tokens WHERE doctor_id = $1 AND queue_date = $2`,
      [doctorId, queueDate]
    );

    // 3 queue_tokens for today
    await client.query(
      `INSERT INTO queue_tokens (doctor_id, patient_id, queue_date, token_number, status)
       VALUES
         ($1, $2, $3, 1, 'serving'),
         ($1, $4, $3, 2, 'waiting'),
         ($1, $5, $3, 3, 'waiting')`,
      [doctorId, patient1Id, queueDate, patient2Id, patient3Id]
    );

    await client.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('Development data seeded successfully.');
    // Quiet use of adminUserId so linters don't complain
    void adminUserId;
  } catch (err) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Error seeding development data:', err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().then(() => {
  process.exit();
});

