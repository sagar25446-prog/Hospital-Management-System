const express = require('express');
const router = express.Router();
const emrController = require('./emr.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/prescriptions', asyncHandler(emrController.addPrescription));
router.get('/prescriptions/:patientId?', asyncHandler(emrController.getMyPrescriptions));

module.exports = router;
