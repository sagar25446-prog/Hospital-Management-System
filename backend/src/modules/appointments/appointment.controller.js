/**
 * Appointment controller: validate input, enforce role/own-resource, call service, send JSON.
 */

const appointmentService = require('./appointment.service');
const queueService = require('../queue/queue.service');
const {
  validateBookAppointment,
  validateListQuery,
  validateUpdateStatus,
} = require('./appointment.validation');

async function bookAppointment(req, res, next) {
  const result = validateBookAppointment(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  try {
    if (req.user.role === 'patient') {
      const ownPatientId = await queueService.getPatientIdByUserId(req.user.id);
      if (ownPatientId !== result.value.patientId) {
        return res.status(403).json({ message: 'You can only book appointments for yourself' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const appointment = await appointmentService.bookAppointment(result.value);
    return res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

async function listDoctorAppointments(req, res, next) {
  const { doctorId } = req.params;
  const listResult = validateListQuery(req.query);
  if (listResult.error) {
    return res.status(400).json({ message: listResult.error });
  }
  try {
    if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (ownDoctorId !== doctorId) {
        return res.status(403).json({ message: 'You can only list your own appointments' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const list = await appointmentService.listDoctorAppointments(doctorId, listResult.value);
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

async function listPatientAppointments(req, res, next) {
  const { patientId } = req.params;
  const listResult = validateListQuery(req.query);
  if (listResult.error) {
    return res.status(400).json({ message: listResult.error });
  }
  try {
    if (req.user.role === 'patient') {
      const ownPatientId = await queueService.getPatientIdByUserId(req.user.id);
      if (ownPatientId !== patientId) {
        return res.status(403).json({ message: 'You can only list your own appointments' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const list = await appointmentService.listPatientAppointments(patientId, listResult.value);
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getAppointment(req, res, next) {
  const { id } = req.params;
  try {
    const appointment = await appointmentService.getAppointmentById(id);
    if (req.user.role === 'patient') {
      const ownPatientId = await queueService.getPatientIdByUserId(req.user.id);
      if (ownPatientId !== appointment.patient_id) {
        return res.status(403).json({ message: 'You can only view your own appointments' });
      }
    } else if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (ownDoctorId !== appointment.doctor_id) {
        return res.status(403).json({ message: 'You can only view your own appointments' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return res.json(appointment);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  const result = validateUpdateStatus(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  const { id } = req.params;
  try {
    const appointment = await appointmentService.getAppointmentById(id);
    if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (ownDoctorId !== appointment.doctor_id) {
        return res.status(403).json({ message: 'You can only update your own appointments' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const updated = await appointmentService.updateAppointmentStatus(id, result.value.status);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function cancelAppointment(req, res, next) {
  const { id } = req.params;
  try {
    const appointment = await appointmentService.getAppointmentById(id);
    if (req.user.role === 'patient') {
      const ownPatientId = await queueService.getPatientIdByUserId(req.user.id);
      if (ownPatientId !== appointment.patient_id) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
    } else if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (ownDoctorId !== appointment.doctor_id) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const updated = await appointmentService.cancelAppointment(id);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  bookAppointment,
  listDoctorAppointments,
  listPatientAppointments,
  getAppointment,
  updateStatus,
  cancelAppointment,
};
