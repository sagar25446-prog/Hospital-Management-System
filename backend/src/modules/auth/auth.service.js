/**
 * Auth business logic: register, login, refresh, logout, get current user.
 * Uses pool for DB; bcrypt for passwords; JWT for tokens; refresh tokens stored as hash.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../../config/database');
const { ApiError } = require('../../utils/ApiError');

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

/**
 * Issue a fresh access + refresh token pair for a user, persist the refresh
 * token hash, and return everything the controller needs to set cookies.
 * Shared by password login, register, refresh, and Google sign-in so token
 * shape/expiry can never drift between auth methods.
 */
async function issueTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashRefreshToken(refreshToken), expiresAt]
  );
  return { accessToken, refreshToken, expiresIn: 900 };
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toUserDto(row) {
  if (!row) return null;
  const { password_hash, ...dto } = row;
  return dto;
}

/**
 * Register: create user + patient or doctor in one transaction. Returns tokens and user DTO.
 */
async function register(data) {
  const {
    email,
    password,
    role,
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    address,
    blood_group,
    specialization,
    qualification,
    consultation_fee,
  } = data;

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, is_active, created_at, updated_at`,
      [email, password_hash, role]
    );
    const user = userResult.rows[0];
    const userId = user.id;

    if (role === 'patient') {
      await client.query(
        `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, first_name, last_name, date_of_birth, gender, phone, address, blood_group]
      );
    } else if (role === 'doctor') {
      await client.query(
        `INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, consultation_fee)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, first_name, last_name, specialization, qualification, consultation_fee ?? 0]
      );
    }

    await client.query('COMMIT');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashRefreshToken(refreshToken), expiresAt]
    );

    return {
      user: toUserDto(user),
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      throw new ApiError(409, 'Email already registered');
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Login: verify credentials, return tokens and user DTO.
 */
async function login(email, password) {
  const result = await pool.query(
    `SELECT id, email, password_hash, role, is_active, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.is_active) {
    throw new ApiError(403, 'Account is deactivated');
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashRefreshToken(refreshToken), expiresAt]
  );

  return {
    user: toUserDto(user),
    accessToken,
    refreshToken,
    expiresIn: 900,
  };
}

/**
 * Refresh: verify refresh token, rotate (delete old, issue new), return new tokens.
 */
async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  const tokenHash = hashRefreshToken(refreshToken);
  const found = await pool.query(
    `SELECT id, user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash]
  );
  if (found.rows.length === 0) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);

  const userId = found.rows[0].user_id;
  const userResult = await pool.query(
    `SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const newAccessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const newRefreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashRefreshToken(newRefreshToken), expiresAt]
  );

  return {
    user: toUserDto(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  };
}

/**
 * Logout: invalidate the given refresh token.
 */
async function logout(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
  return { success: true };
}

/**
 * Get current user by id; include patient or doctor profile if present.
 */
async function getMe(userId) {
  const userResult = await pool.query(
    `SELECT id, email, role, is_active, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const dto = toUserDto(user);
  dto.profile = null;

  if (user.role === 'patient') {
    const p = await pool.query(
      `SELECT id, user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group, created_at, updated_at
       FROM patients WHERE user_id = $1`,
      [userId]
    );
    if (p.rows[0]) dto.profile = p.rows[0];
  } else if (user.role === 'doctor') {
    const d = await pool.query(
      `SELECT id, user_id, first_name, last_name, specialization, qualification, consultation_fee, is_available, created_at, updated_at
       FROM doctors WHERE user_id = $1`,
      [userId]
    );
    if (d.rows[0]) dto.profile = d.rows[0];
  }

  return dto;
}

/**
 * Google sign-in / sign-up: verify the Google ID token server-side (never trust
 * the client's claims about who it is), then:
 *   1. If a user is already linked to this Google account -> log them in.
 *   2. Else if a *verified* Google email matches an existing local account -> link it.
 *   3. Else create a brand-new patient account.
 * Always returns the same shape as login()/register() so the controller can
 * set cookies identically regardless of auth method.
 */
async function loginWithGoogle(idToken) {
  if (!googleClient) {
    throw new ApiError(500, 'Google sign-in is not configured on this server');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new ApiError(401, 'Invalid Google credential');
  }

  if (!payload || !payload.email) {
    throw new ApiError(401, 'Google account has no verifiable email');
  }
  if (!payload.email_verified) {
    throw new ApiError(401, 'Google email is not verified');
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const avatarUrl = payload.picture || null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Already linked to this Google account?
    let result = await client.query(
      `SELECT id, email, role, is_active, created_at, updated_at
       FROM users WHERE google_id = $1`,
      [googleId]
    );
    let user = result.rows[0];

    if (!user) {
      // 2. Existing local account with the same verified email -> link it.
      result = await client.query(
        `SELECT id, email, role, is_active, created_at, updated_at
         FROM users WHERE email = $1`,
        [email]
      );
      user = result.rows[0];

      if (user) {
        await client.query(
          `UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), updated_at = NOW()
           WHERE id = $3`,
          [googleId, avatarUrl, user.id]
        );
      } else {
        // 3. Brand-new account. Google sign-in only ever creates patients;
        // doctor/reception/admin accounts are provisioned by an admin.
        const firstName = payload.given_name || payload.name || 'New';
        const lastName = payload.family_name || 'Patient';

        const userResult = await client.query(
          `INSERT INTO users (email, role, google_id, avatar_url, auth_provider)
           VALUES ($1, 'patient', $2, $3, 'google')
           RETURNING id, email, role, is_active, created_at, updated_at`,
          [email, googleId, avatarUrl]
        );
        user = userResult.rows[0];

        await client.query(
          `INSERT INTO patients (user_id, first_name, last_name)
           VALUES ($1, $2, $3)`,
          [user.id, firstName, lastName]
        );
      }
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account is deactivated');
    }

    await client.query('COMMIT');

    const tokens = await issueTokens(user);
    return { user: toUserDto(user), ...tokens };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  loginWithGoogle,
};
