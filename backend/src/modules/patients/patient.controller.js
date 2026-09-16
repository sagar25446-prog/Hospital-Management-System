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

// ──────────── Document Uploads ────────────

async function uploadDocument(req, res, next) {
  const { id } = req.params;
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only upload documents to your own profile' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const { file_name, file_type, file_data, category, notes } = req.body;
    if (!file_name || !file_type || !file_data) {
      return res.status(400).json({ message: 'file_name, file_type, and file_data are required' });
    }
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file_type)) {
      return res.status(400).json({ message: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' });
    }
    const doc = await patientService.uploadDocument(id, { file_name, file_type, file_data, category, notes });
    return res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

async function listDocuments(req, res, next) {
  const { id } = req.params;
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only view your own documents' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const docs = await patientService.listDocuments(id);
    return res.json(docs);
  } catch (err) {
    next(err);
  }
}

async function downloadDocument(req, res, next) {
  const { docId } = req.params;
  try {
    const doc = await patientService.getDocument(docId);
    // Authorization: patient can only download own documents
    if (req.user?.role === 'patient') {
      const ownId = await patientService.getPatientIdByUserId(req.user.id);
      if (ownId !== doc.patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (!['admin', 'reception', 'doctor'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return res.json(doc);
  } catch (err) {
    next(err);
  }
}

async function deleteDocument(req, res, next) {
  const { id, docId } = req.params;
  try {
    const ownId = req.user?.role === 'patient' ? await patientService.getPatientIdByUserId(req.user.id) : null;
    if (req.user?.role === 'patient' && ownId !== id) {
      return res.status(403).json({ message: 'You can only delete your own documents' });
    }
    if (!['admin', 'reception'].includes(req.user?.role) && req.user?.role !== 'patient') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const result = await patientService.deleteDocument(docId, id);
    return res.json(result);
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
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
};
