/**
 * Auth routes: POST register, login, refresh, logout; GET me.
 * /me and refresh require no role middleware here; refresh is public with token in body.
 */

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { asyncHandler } = require('../../utils/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.getMe));

module.exports = router;
