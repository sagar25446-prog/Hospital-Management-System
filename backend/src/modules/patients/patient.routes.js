/**
 * Patient routes. List/create = admin, reception. Get/update/history = admin, reception, or patient (own).
 */

const express = require('express');
const router = express.Router();
const patientController = require('./patient.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', requireRole(['admin', 'reception']), asyncHandler(patientController.createPatient));
router.get('/', requireRole(['admin', 'reception']), asyncHandler(patientController.listPatients));
router.get('/:id', asyncHandler(patientController.getPatientProfile));
router.patch('/:id', asyncHandler(patientController.updatePatient));
router.get('/:id/queue-history', asyncHandler(patientController.getQueueHistory));
router.get('/:id/appointment-history', asyncHandler(patientController.getAppointmentHistory));

// Document upload endpoints
router.post('/:id/documents', asyncHandler(patientController.uploadDocument));
router.get('/:id/documents', asyncHandler(patientController.listDocuments));
router.get('/documents/:docId', asyncHandler(patientController.downloadDocument));
router.delete('/:id/documents/:docId', asyncHandler(patientController.deleteDocument));

module.exports = router;
