/**
 * Doctor routes.
 * Public: GET / (list), GET /specializations, GET /:id, GET /:id/schedule
 * Auth required: POST / (admin only), PATCH /:id (admin/doctor own), PUT /:id/schedule (admin/doctor own)
 */

const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/roleMiddleware');

// Public routes — no auth required
router.get('/specializations', asyncHandler(doctorController.getSpecializations));
router.get('/', asyncHandler(doctorController.listDoctors));
router.get('/:id', asyncHandler(doctorController.getDoctorProfile));
router.get('/:id/schedule', asyncHandler(doctorController.getSchedule));

// Protected routes — require authentication
router.post('/', authMiddleware, requireRole(['admin']), asyncHandler(doctorController.createDoctor));
router.patch('/:id', authMiddleware, asyncHandler(doctorController.updateDoctor));
router.put('/:id/schedule', authMiddleware, asyncHandler(doctorController.setSchedule));

module.exports = router;
