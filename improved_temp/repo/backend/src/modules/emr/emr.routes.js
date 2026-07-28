const express = require('express');
const router = express.Router();
const emrController = require('./emr.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { auditLog } = require('../audit/auditLog.middleware');

router.use(authMiddleware);
router.use(auditLog('prescription')); // every prescription read/write is logged for later review

router.post('/prescriptions', asyncHandler(emrController.addPrescription));
router.get('/prescriptions/:patientId?', asyncHandler(emrController.getMyPrescriptions));

module.exports = router;
