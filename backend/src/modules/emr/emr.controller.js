const emrService = require('./emr.service');
const queueService = require('../queue/queue.service');
const { ApiError } = require('../../utils/ApiError');
const { createPrescriptionSchema } = require('./emr.validation');
const { pool } = require('../../config/database');

async function addPrescription(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      throw new ApiError(403, 'Only doctors can write prescriptions');
    }
    
    const { error, value } = createPrescriptionSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }
    
    const doctorId = await queueService.getDoctorIdByUserId(req.user.id);
    
    // Security: verify appointment ownership if provided, otherwise allow walk-in prescriptions
    if (value.appointmentId) {
      const apptCheck = await pool.query('SELECT doctor_id, patient_id FROM appointments WHERE id = $1', [value.appointmentId]);
      if (apptCheck.rows.length === 0) throw new ApiError(404, 'Appointment not found');
      if (String(apptCheck.rows[0].doctor_id) !== String(doctorId)) throw new ApiError(403, 'You are not assigned to this appointment');
      if (String(apptCheck.rows[0].patient_id) !== String(value.patientId)) throw new ApiError(400, 'Appointment patient mismatch');
    }
    
    const data = { ...value, doctorId };
    
    const result = await emrService.createPrescription(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMyPrescriptions(req, res, next) {
  try {
    let patientId = req.params.patientId;
    
    if (req.user.role === 'patient') {
      const ownId = await queueService.getPatientIdByUserId(req.user.id);
      if (patientId && patientId !== ownId) {
        throw new ApiError(403, 'You can only view your own prescriptions');
      }
      patientId = ownId;
    } else if (req.user.role === 'doctor') {
      if (!patientId) throw new ApiError(400, 'patientId is required');
      const doctorId = await queueService.getDoctorIdByUserId(req.user.id);
      const check = await pool.query(
        `SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2
         UNION ALL
         SELECT 1 FROM queue_tokens WHERE doctor_id = $1 AND patient_id = $2
         LIMIT 1`,
        [doctorId, patientId]
      );
      if (check.rows.length === 0) throw new ApiError(403, 'You have not treated this patient');
    } else if (['admin', 'reception'].includes(req.user.role)) {
      if (!patientId) throw new ApiError(400, 'patientId is required');
    } else {
      throw new ApiError(403, 'Insufficient permissions');
    }
    
    const result = await emrService.getPatientPrescriptions(patientId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addPrescription,
  getMyPrescriptions
};
