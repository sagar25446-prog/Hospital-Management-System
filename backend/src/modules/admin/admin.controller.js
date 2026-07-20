/**
 * Admin controller: call service, return JSON. Role enforcement in routes (admin only).
 */

const adminService = require('./admin.service');
const bcrypt = require('bcrypt');
const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');

function parseDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(trimmed + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : trimmed;
}

async function getDashboard(req, res, next) {
  try {
    const raw = req.query.date?.trim();
    if (raw !== undefined && raw !== '') {
      const date = parseDate(raw);
      if (!date) return res.status(400).json({ message: 'Invalid date (use YYYY-MM-DD)' });
      const metrics = await adminService.getDashboardMetrics(date);
      return res.json(metrics);
    }
    const metrics = await adminService.getDashboardMetrics(undefined);
    return res.json(metrics);
  } catch (err) {
    next(err);
  }
}

async function getQueues(req, res, next) {
  try {
    const raw = req.query.date?.trim();
    if (raw !== undefined && raw !== '') {
      const date = parseDate(raw);
      if (!date) return res.status(400).json({ message: 'Invalid date (use YYYY-MM-DD)' });
      const queues = await adminService.getActiveQueues(date);
      return res.json(queues);
    }
    const queues = await adminService.getActiveQueues(undefined);
    return res.json(queues);
  } catch (err) {
    next(err);
  }
}

async function getDoctorsWorkload(req, res, next) {
  try {
    const raw = req.query.date?.trim();
    if (raw !== undefined && raw !== '') {
      const date = parseDate(raw);
      if (!date) return res.status(400).json({ message: 'Invalid date (use YYYY-MM-DD)' });
      const workload = await adminService.getDoctorsWorkload(date);
      return res.json(workload);
    }
    const workload = await adminService.getDoctorsWorkload(undefined);
    return res.json(workload);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getStats();
    return res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function createStaffUser(req, res, next) {
  const { email, password, first_name, last_name, role } = req.body || {};
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'Email, password, first name, and last name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const allowedRoles = ['reception', 'admin'];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Role must be reception or admin' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
       RETURNING id, email, role, is_active, created_at`,
      [email.trim().toLowerCase(), password_hash, role]
    );
    return res.status(201).json({ ...result.rows[0], first_name, last_name });
  } catch (err) {
    if (err.code === '23505') return next(new ApiError(409, 'Email already registered'));
    next(err);
  }
}

async function listStaffUsers(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, email, role, is_active, created_at FROM users WHERE role IN ('reception', 'admin') ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getQueues,
  getDoctorsWorkload,
  getStats,
  createStaffUser,
  listStaffUsers,
};
