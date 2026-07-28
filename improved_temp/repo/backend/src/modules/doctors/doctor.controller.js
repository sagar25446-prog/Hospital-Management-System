/**
 * Doctor controller: validate, enforce role/own-resource, call service, send JSON.
 */

const doctorService = require('./doctor.service');
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateScheduleBody,
  validateListQuery,
} = require('./doctor.validation');

async function createDoctor(req, res, next) {
  const result = validateCreateDoctor(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  try {
    const doctor = await doctorService.createDoctor(result.value);
    return res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

async function listDoctors(req, res, next) {
  const listResult = validateListQuery(req.query);
  try {
    const doctors = await doctorService.listDoctors(listResult.value);
    return res.json(doctors);
  } catch (err) {
    next(err);
  }
}

async function getDoctorProfile(req, res, next) {
  const { id } = req.params;
  const includeEmail = req.user && ['admin', 'reception'].includes(req.user.role);
  try {
    const profile = await doctorService.getDoctorProfile(id, includeEmail);
    return res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  const result = validateUpdateDoctor(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  const { id } = req.params;
  try {
    if (req.user.role === 'doctor') {
      const ownId = await doctorService.getDoctorIdByUserId(req.user.id);
      if (ownId !== id) return res.status(403).json({ message: 'You can only update your own profile' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const doctor = await doctorService.updateDoctor(id, result.value);
    return res.json(doctor);
  } catch (err) {
    next(err);
  }
}

async function getSchedule(req, res, next) {
  const { id } = req.params;
  try {
    const schedule = await doctorService.getSchedule(id);
    return res.json(schedule);
  } catch (err) {
    next(err);
  }
}

async function setSchedule(req, res, next) {
  const result = validateScheduleBody(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  const { id } = req.params;
  try {
    if (req.user.role === 'doctor') {
      const ownId = await doctorService.getDoctorIdByUserId(req.user.id);
      if (ownId !== id) return res.status(403).json({ message: 'You can only update your own schedule' });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const schedule = await doctorService.setSchedule(id, result.value.slots);
    return res.json(schedule);
  } catch (err) {
    next(err);
  }
}

async function getSpecializations(req, res, next) {
  try {
    const list = await doctorService.getSpecializations();
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDoctor,
  listDoctors,
  getDoctorProfile,
  updateDoctor,
  getSchedule,
  setSchedule,
  getSpecializations,
};
