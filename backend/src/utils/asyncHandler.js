/**
 * Wraps async route handlers so Express catches rejected promises.
 * Usage: router.post('/login', asyncHandler(controller.login))
 */

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
