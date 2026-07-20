/**
 * Appointment routes: book, list by doctor/patient, get by id, update status, cancel.
 * All routes require authentication; controller enforces role and own-resource.
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', asyncHandler(appointmentController.bookAppointment));
router.get('/doctors/:doctorId', asyncHandler(appointmentController.listDoctorAppointments));
router.get('/patients/:patientId', asyncHandler(appointmentController.listPatientAppointments));
router.get('/:id', asyncHandler(appointmentController.getAppointment));
router.patch('/:id/status', asyncHandler(appointmentController.updateStatus));
router.post('/:id/cancel', asyncHandler(appointmentController.cancelAppointment));

module.exports = router;
