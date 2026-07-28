/**
 * Symptom checker routes.
 * Public: POST /analyze (no auth — useful before a patient even registers), GET /status
 */

const express = require('express');
const router = express.Router();
const controller = require('./symptomChecker.controller');
const { asyncHandler } = require('../../utils/asyncHandler');

router.post('/analyze', asyncHandler(controller.analyze));
router.get('/status', asyncHandler(controller.status));

module.exports = router;
