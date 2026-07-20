/**
 * Patient controller: validate, enforce role/own-resource, call service, send JSON.
 */

const patientService = require('./patient.service');
const {
  validateCreatePatient,
  validateUpdatePatient,
  validateListQuery,
  validateHistoryQuery,
} = require('./patient.validation');

async function createPatient(req, res, next) {
  const result = validateCreatePatient(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  try {
    const patient = await patientService.createPatient(result.value);
    return res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
}

async function listPatients(req, res, next) {
  const listResult = validateListQuery(req.query);
  try {
    const patients = await patientService.listPatients(listResult.value);
    return res.json(patients);
  } catch (err) {
    next(err);
  }
}

async function getPatientProfile(req, res, next) {
  const { id } = req.params;
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const includeEmail = ['admin', 'reception'].includes(req.user?.role);
    const profile = await patientService.getPatientProfile(id, includeEmail);
    return res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updatePatient(req, res, next) {
  const result = validateUpdatePatient(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  const { id } = req.params;
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const patient = await patientService.updatePatient(id, result.value);
    return res.json(patient);
  } catch (err) {
    next(err);
  }
}

async function getQueueHistory(req, res, next) {
  const { id } = req.params;
  const histResult = validateHistoryQuery(req.query);
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only view your own queue history' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const history = await patientService.getQueueHistory(id, histResult.value.limit, histResult.value.offset);
    return res.json(history);
  } catch (err) {
    next(err);
  }
}

async function getAppointmentHistory(req, res, next) {
  const { id } = req.params;
  const histResult = validateHistoryQuery(req.query);
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only view your own appointment history' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const history = await patientService.getAppointmentHistory(id, histResult.value.limit, histResult.value.offset);
    return res.json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPatient,
  listPatients,
  getPatientProfile,
  updatePatient,
  getQueueHistory,
  getAppointmentHistory,
};
