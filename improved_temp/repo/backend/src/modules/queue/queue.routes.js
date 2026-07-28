/**
 * Queue routes: generate token, get queue, update current, estimate, upcoming, reset.
 * Public: GET /doctors/:doctorId (queue view), GET /doctors/:doctorId/estimate, GET /doctors/:doctorId/upcoming
 * Authenticated: POST /token, PATCH /doctors/:doctorId/current, POST /doctors/:doctorId/reset
 */

const express = require('express');
const router = express.Router();
const queueController = require('./queue.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

// Public queue routes - no auth required (patients, display screens, waiting room TVs)
router.get('/doctors/:doctorId', asyncHandler(queueController.getCurrentQueue));
router.get('/doctors/:doctorId/estimate', asyncHandler(queueController.estimateWaitingTime));
router.get('/doctors/:doctorId/upcoming', asyncHandler(queueController.listUpcomingTokens));

// Authenticated operations: token creation, doctor queue control, reset
router.post('/token', authMiddleware, asyncHandler(queueController.generateToken));
router.patch('/doctors/:doctorId/current', authMiddleware, asyncHandler(queueController.updateCurrentToken));
router.post('/doctors/:doctorId/reset', authMiddleware, asyncHandler(queueController.resetDailyQueue));

module.exports = router;
