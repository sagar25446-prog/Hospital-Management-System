const auditService = require('./audit.service');

/**
 * Usage: router.use(auditLog('prescription')) mounted after authMiddleware.
 * Logs once the response has actually been sent (res.on('finish')) so the
 * status code is known, and never awaits the write — a slow or failed
 * audit insert must never delay or break the real request.
 */
function auditLog(resourceType) {
  return (req, res, next) => {
    res.on('finish', () => {
      // Only log mutating/read access to the resource, skip health checks etc.
      auditService.record({
        userId: req.user?.id,
        userRole: req.user?.role,
        action: `${resourceType}.${req.method.toLowerCase()}`,
        resourceType,
        resourceId: req.params?.id || req.params?.patientId || null,
        method: req.method,
        path: req.originalUrl,
        ipAddress: req.ip,
        statusCode: res.statusCode,
      });
    });
    next();
  };
}

module.exports = { auditLog };
