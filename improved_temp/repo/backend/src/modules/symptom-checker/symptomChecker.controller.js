const symptomChecker = require('./symptomChecker.service');
const { ApiError } = require('../../utils/ApiError');

async function analyze(req, res) {
  const text = req.body?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new ApiError(400, 'Please describe your symptoms in a few words.');
  }
  if (text.length > 2000) {
    throw new ApiError(400, 'That description is too long — please keep it under 2000 characters.');
  }

  const result = await symptomChecker.analyze(text);
  return res.json(result);
}

function status(req, res) {
  return res.json({ aiConfigured: symptomChecker.isAiConfigured() });
}

module.exports = { analyze, status };
