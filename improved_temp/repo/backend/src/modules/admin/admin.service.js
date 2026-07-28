/**
 * Admin dashboard: dashboard metrics, active queues, doctor workload, system stats.
 * All queries scoped by today (or date param) where relevant. PostgreSQL aggregations only.
 */

const { pool } = require('../../config/database');

const DEFAULT_AVG_CONSULTATION_MINUTES = 10;

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Dashboard: total patients today (distinct), total appointments today, active queues list, average waiting time.
 */
async function getDashboardMetrics(dateStr) {
  const today = dateStr || getTodayDate();

  const [patientsResult, appointmentsResult, activeQueuesResult, avgWaitResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS count FROM (
        SELECT patient_id FROM queue_tokens WHERE queue_date = $1
        UNION
        SELECT patient_id FROM appointments WHERE appointment_date = $1 AND status != 'cancelled'
      ) u`,
      [today]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments
       WHERE appointment_date = $1 AND status IN ('scheduled', 'completed')`,
      [today]
    ),
    pool.query(
      `SELECT d.id AS doctor_id, d.first_name, d.last_name, d.specialization,
              dq.current_token_number, dq.last_token_number, COUNT(qt.id)::int AS active_count
       FROM doctor_daily_queue dq
       INNER JOIN queue_tokens qt ON qt.doctor_id = dq.doctor_id AND qt.queue_date = dq.queue_date
         AND qt.status IN ('waiting', 'called', 'serving')
       INNER JOIN doctors d ON d.id = dq.doctor_id
       WHERE dq.queue_date = $1
       GROUP BY dq.doctor_id, dq.current_token_number, dq.last_token_number, d.id, d.first_name, d.last_name, d.specialization
       ORDER BY active_count DESC, d.last_name, d.first_name`,
      [today]
    ),
    pool.query(
      `SELECT COALESCE(AVG(GREATEST(0, (qt.token_number - COALESCE(dq.current_token_number, 0) - 1) * $1)), 0)::numeric(10,2) AS avg_minutes
       FROM queue_tokens qt
       LEFT JOIN doctor_daily_queue dq ON dq.doctor_id = qt.doctor_id AND dq.queue_date = qt.queue_date
       WHERE qt.queue_date = $2 AND qt.status = 'waiting'`,
      [DEFAULT_AVG_CONSULTATION_MINUTES, today]
    ),
  ]);

  const totalPatientsToday = patientsResult.rows[0]?.count ?? 0;
  const totalAppointmentsToday = appointmentsResult.rows[0]?.count ?? 0;
  const activeQueues = activeQueuesResult.rows.map((r) => ({
    doctorId: r.doctor_id,
    doctorName: `${r.first_name} ${r.last_name}`.trim(),
    specialization: r.specialization,
    currentTokenNumber: Number(r.current_token_number),
    lastTokenNumber: Number(r.last_token_number),
    activeCount: r.active_count,
  }));
  const averageWaitingTimeMinutes = Number(avgWaitResult.rows[0]?.avg_minutes ?? 0);

  return {
    totalPatientsToday,
    totalAppointmentsToday,
    activeQueues,
    averageWaitingTimeMinutes,
  };
}

/**
 * List active queues for all doctors (today): doctors who have at least one token in waiting/called/serving.
 */
async function getActiveQueues(dateStr) {
  const today = dateStr || getTodayDate();
  const result = await pool.query(
    `SELECT d.id AS doctor_id, d.first_name, d.last_name, d.specialization,
            dq.current_token_number, dq.last_token_number, COUNT(qt.id)::int AS active_count
     FROM doctor_daily_queue dq
     INNER JOIN queue_tokens qt ON qt.doctor_id = dq.doctor_id AND qt.queue_date = dq.queue_date
       AND qt.status IN ('waiting', 'called', 'serving')
     INNER JOIN doctors d ON d.id = dq.doctor_id
     WHERE dq.queue_date = $1
     GROUP BY dq.doctor_id, dq.current_token_number, dq.last_token_number, d.id, d.first_name, d.last_name, d.specialization
     ORDER BY active_count DESC, d.last_name, d.first_name`,
    [today]
  );
  return result.rows.map((r) => ({
    doctorId: r.doctor_id,
    doctorName: `${r.first_name} ${r.last_name}`.trim(),
    specialization: r.specialization,
    currentTokenNumber: Number(r.current_token_number),
    lastTokenNumber: Number(r.last_token_number),
    activeCount: r.active_count,
  }));
}

/**
 * Number of patients (queue tokens) per doctor today. Include all doctors; 0 if no tokens today.
 */
async function getDoctorsWorkload(dateStr) {
  const today = dateStr || getTodayDate();
  const result = await pool.query(
    `SELECT d.id AS doctor_id, d.first_name, d.last_name, d.specialization,
            COALESCE(COUNT(qt.id) FILTER (WHERE qt.status != 'cancelled'), 0)::int AS patient_count_today
     FROM doctors d
     LEFT JOIN queue_tokens qt ON qt.doctor_id = d.id AND qt.queue_date = $1
     GROUP BY d.id, d.first_name, d.last_name, d.specialization
     ORDER BY patient_count_today DESC, d.last_name, d.first_name`,
    [today]
  );
  return result.rows.map((r) => ({
    doctorId: r.doctor_id,
    firstName: r.first_name,
    lastName: r.last_name,
    specialization: r.specialization,
    patientCountToday: r.patient_count_today,
  }));
}

/**
 * System summary: total users by role, patients, doctors, appointments (today / week / total), queue tokens today.
 */
async function getStats() {
  const today = getTodayDate();

  const [usersResult, patientsResult, doctorsResult, appointmentsResult, queueTokensResult] = await Promise.all([
    pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users WHERE is_active = true GROUP BY role`
    ),
    pool.query('SELECT COUNT(*)::int AS count FROM patients'),
    pool.query('SELECT COUNT(*)::int AS count FROM doctors'),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE appointment_date = $1)::int AS today,
         COUNT(*) FILTER (WHERE appointment_date >= $1::date - INTERVAL '7 days' AND appointment_date <= $1)::int AS week,
         COUNT(*)::int AS total
       FROM appointments`,
      [today]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM queue_tokens WHERE queue_date = $1`,
      [today]
    ),
  ]);

  const usersByRole = usersResult.rows.reduce((acc, r) => {
    acc[r.role] = r.count;
    return acc;
  }, {});

  return {
    totalUsers: usersResult.rows.reduce((s, r) => s + r.count, 0),
    usersByRole,
    totalPatients: patientsResult.rows[0]?.count ?? 0,
    totalDoctors: doctorsResult.rows[0]?.count ?? 0,
    appointmentsToday: appointmentsResult.rows[0]?.today ?? 0,
    appointmentsThisWeek: appointmentsResult.rows[0]?.week ?? 0,
    appointmentsTotal: appointmentsResult.rows[0]?.total ?? 0,
    queueTokensToday: queueTokensResult.rows[0]?.count ?? 0,
  };
}

module.exports = {
  getDashboardMetrics,
  getActiveQueues,
  getDoctorsWorkload,
  getStats,
};
