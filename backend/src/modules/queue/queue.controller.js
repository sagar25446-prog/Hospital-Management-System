/**
 * Queue controller: validate input, enforce role/own-resource, call service, send JSON.
 */

const queueService = require('./queue.service');
const {
  validateGenerateToken,
  validateUpdateCurrent,
  validateEstimateQuery,
  validateDateQuery,
  validateResetQuery,
  getTodayDate,
} = require('./queue.validation');

async function generateToken(req, res, next) {
  const result = validateGenerateToken(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  const { doctorId, patientId } = result.value;
  let dateStr = getTodayDate();
  if (req.query.date) {
    const dateResult = validateDateQuery(req.query);
    if (dateResult.error) {
      return res.status(400).json({ message: dateResult.error });
    }
    dateStr = dateResult.value.date;
  }
  try {
    if (req.user.role === 'patient') {
      const ownPatientId = await queueService.getPatientIdByUserId(req.user.id);
      if (ownPatientId !== patientId) {
        return res.status(403).json({ message: 'You can only generate a token for yourself' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const token = await queueService.generateToken(doctorId, patientId, dateStr);
    return res.status(201).json(token);
  } catch (err) {
    next(err);
  }
}

async function getCurrentQueue(req, res, next) {
  const { doctorId } = req.params;
  const dateResult = validateDateQuery(req.query);
  if (dateResult.error) {
    return res.status(400).json({ message: dateResult.error });
  }
  const dateStr = dateResult.value.date;
  try {
    const queue = await queueService.getCurrentQueue(doctorId, dateStr);
    return res.json(queue);
  } catch (err) {
    next(err);
  }
}

async function updateCurrentToken(req, res, next) {
  const result = validateUpdateCurrent(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  const { doctorId } = req.params;
  const { currentTokenNumber } = result.value;
  let dateStr = getTodayDate();
  if (req.query.date) {
    const dateResult = validateDateQuery(req.query);
    if (dateResult.error) {
      return res.status(400).json({ message: dateResult.error });
    }
    dateStr = dateResult.value.date;
  }
  try {
    if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (parseInt(ownDoctorId) !== parseInt(doctorId)) {
        return res.status(403).json({ message: 'You can only update queue for yourself' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const updated = await queueService.updateCurrentToken(doctorId, currentTokenNumber, dateStr);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function estimateWaitingTime(req, res, next) {
  const { doctorId } = req.params;
  const estResult = validateEstimateQuery(req.query);
  if (estResult.error) {
    return res.status(400).json({ message: estResult.error });
  }
  const dateResult = validateDateQuery(req.query);
  if (dateResult.error) {
    return res.status(400).json({ message: dateResult.error });
  }
  const dateStr = dateResult.value.date;
  try {
    const byTokenId = Boolean(estResult.value.tokenId);
    const tokenNumberOrId = byTokenId ? estResult.value.tokenId : estResult.value.tokenNumber;
    const estimate = await queueService.estimateWaitingTime(
      doctorId,
      dateStr,
      tokenNumberOrId,
      byTokenId
    );
    return res.json(estimate);
  } catch (err) {
    next(err);
  }
}

async function listUpcomingTokens(req, res, next) {
  const { doctorId } = req.params;
  const dateResult = validateDateQuery(req.query);
  if (dateResult.error) {
    return res.status(400).json({ message: dateResult.error });
  }
  const dateStr = dateResult.value.date;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    const data = await queueService.listUpcomingTokens(doctorId, dateStr, limit);
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function resetDailyQueue(req, res, next) {
  const { doctorId } = req.params;
  const resetResult = validateResetQuery(req.query);
  if (resetResult.error) {
    return res.status(400).json({ message: resetResult.error });
  }
  const dateStr = resetResult.value.date;
  try {
    if (req.user.role === 'doctor') {
      const ownDoctorId = await queueService.getDoctorIdByUserId(req.user.id);
      if (parseInt(ownDoctorId) !== parseInt(doctorId)) {
        return res.status(403).json({ message: 'You can only reset queue for yourself' });
      }
    } else if (!['admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const updated = await queueService.resetDailyQueue(doctorId, dateStr);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateToken,
  getCurrentQueue,
  updateCurrentToken,
  estimateWaitingTime,
  listUpcomingTokens,
  resetDailyQueue,
};
