/**
 * Admin routes: dashboard, queues, doctors workload, stats. Admin role only.
 */

const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { requireRole } = require('../../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireRole(['admin']));

router.get('/dashboard', asyncHandler(adminController.getDashboard));
router.get('/queues', asyncHandler(adminController.getQueues));
router.get('/doctors/workload', asyncHandler(adminController.getDoctorsWorkload));
router.get('/stats', asyncHandler(adminController.getStats));
router.post('/staff', asyncHandler(adminController.createStaffUser));
router.get('/staff', asyncHandler(adminController.listStaffUsers));

module.exports = router;
