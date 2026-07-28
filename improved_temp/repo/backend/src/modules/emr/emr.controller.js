const emrService = require('./emr.service');
const queueService = require('../queue/queue.service');
const { ApiError } = require('../../utils/ApiError');

async function addPrescription(req, res, next) {
  try {
    if (req.user.role !== 'doctor') throw new ApiError(403, 'Only doctors can write prescriptions');
    
    const doctorId = await queueService.getDoctorIdByUserId(req.user.id);
    const data = { ...req.body, doctorId };
    
    const result = await emrService.createPrescription(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getMyPrescriptions(req, res, next) {
  try {
    let patientId;
    if (req.user.role === 'patient') {
      patientId = await queueService.getPatientIdByUserId(req.user.id);
    } else {
      patientId = req.params.patientId; // admin/doctor viewing
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
