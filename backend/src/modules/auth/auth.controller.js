/**
 * Auth controller: validate input, call service, send JSON response.
 * No business logic here; service throws ApiError for failures.
 */

const authService = require('./auth.service');
const {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
} = require('./auth.validation');

const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',  // 'none' required for cross-origin cookies on Vercel
};

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('hospital_access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 mins
  });
  if (refreshToken) {
    res.cookie('hospital_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
}

async function register(req, res, next) {
  const result = validateRegister(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  try {
    const data = await authService.register(result.value);
    setTokenCookies(res, data.accessToken, data.refreshToken);
    return res.status(201).json({ user: data.user, expiresIn: data.expiresIn });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  const result = validateLogin(req.body);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  try {
    const data = await authService.login(result.value.email, result.value.password);
    setTokenCookies(res, data.accessToken, data.refreshToken);
    return res.json({ user: data.user, expiresIn: data.expiresIn });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  const result = validateRefresh(req.cookies?.hospital_refresh_token);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  try {
    const data = await authService.refresh(result.value.refreshToken);
    setTokenCookies(res, data.accessToken, data.refreshToken);
    return res.json({ user: data.user, expiresIn: data.expiresIn });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  const result = validateLogout(req.cookies?.hospital_refresh_token);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  try {
    await authService.logout(result.value.refreshToken);
    res.clearCookie('hospital_access_token', cookieOptions);
    res.clearCookie('hospital_refresh_token', cookieOptions);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
};
