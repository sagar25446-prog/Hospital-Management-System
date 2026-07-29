const express = require('express');
const router = express.Router();
const emrController = require('./emr.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createPrescriptionSchema, getPrescriptionsSchema } = require('./emr.validation');
const { auditLog } = require('../audit/auditLog.middleware');

router.use(authMiddleware);

router.post('/prescriptions', validate(createPrescriptionSchema, 'body'), auditLog('prescription'), asyncHandler(emrController.addPrescription));
router.get('/prescriptions/:patientId?', validate(getPrescriptionsSchema, 'params'), auditLog('patient_record'), asyncHandler(emrController.getMyPrescriptions));

module.exports = router;
