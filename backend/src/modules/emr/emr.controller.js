const emrService = require('./emr.service');
const queueService = require('../queue/queue.service');
const { ApiError } = require('../../utils/ApiError');

async function addPrescription(req, res, next) {
  try {
    if (req.user.role !== 'doctor') {
      throw new ApiError(403, 'Only doctors can write prescriptions');
    }
    
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
    let patientId = req.params.patientId;
    
    if (req.user.role === 'patient') {
      const ownId = await queueService.getPatientIdByUserId(req.user.id);
      if (patientId && patientId !== ownId) {
        throw new ApiError(403, 'You can only view your own prescriptions');
      }
      patientId = ownId;
    } else if (!patientId) {
      throw new ApiError(400, 'patientId is required for this role');
    }
    
    // Allow doctors and admins/receptionists to query the patientId
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
