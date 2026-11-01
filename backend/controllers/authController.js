const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper to normalize roles from frontend inputs ('ngo' -> 'RECEIVER', etc.)
function normalizeRole(roleInput) {
  if (!roleInput) return 'VOLUNTEER';
  const lower = roleInput.toString().toLowerCase().trim();
  if (lower === 'donor') return 'DONOR';
  if (lower === 'volunteer') return 'VOLUNTEER';
  if (lower === 'ngo' || lower === 'receiver' || lower === 'shelter') return 'RECEIVER';
  if (lower === 'admin') return 'ADMIN';
  return roleInput.toUpperCase();
}

function generateToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'foodbridge_award_winning_secret_key_2026',
    { expiresIn: '30d' }
  );
}

// @desc    Register a new user (Donor, Volunteer, Receiver, Admin)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, city, role, organizationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
    }

    const normalizedRole = normalizeRole(role);
    if (!['DONOR', 'VOLUNTEER', 'RECEIVER', 'ADMIN'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Please select a valid account role.' });
    }
    if (normalizedRole === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be registered publicly.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must contain exactly 10 digits.' });
    }
    if (city && !/^\p{L}+(?:\s\p{L}+)*$/u.test(city.trim())) {
      return res.status(400).json({ success: false, message: 'City can contain letters and spaces only.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const client = await db.pool.connect();
    let user;

    try {
      await client.query('BEGIN');
      const insertUserRes = await client.query(
        `INSERT INTO platform_users (name, email, password_hash, phone, address, city, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, phone, address, city, role, created_at`,
        [name.trim(), cleanEmail, passwordHash, phone || null, address || null, city || 'Pune', normalizedRole]
      );
      user = insertUserRes.rows[0];

      if (normalizedRole === 'DONOR') {
        await client.query(
          `INSERT INTO donor_profiles (user_id, organization_name, contact_person)
           VALUES ($1, $2, $3)`,
          [user.id, organizationName || user.name, user.name]
        );
      } else if (normalizedRole === 'VOLUNTEER') {
        await client.query(
          `INSERT INTO volunteer_profiles (user_id, vehicle_type)
           VALUES ($1, 'MOTORCYCLE')`,
          [user.id]
        );
      } else if (normalizedRole === 'RECEIVER') {
        await client.query(
          `INSERT INTO receiver_profiles (user_id, organization_name)
           VALUES ($1, $2)`,
          [user.id, organizationName || `${user.name} Shelter`]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.',
        });
      }
      throw err;
    } finally {
      client.release();
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        roleKey: user.role === 'RECEIVER' ? 'ngo' : user.role.toLowerCase(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await db.query(
      'SELECT id, name, email, password_hash, phone, address, city, role, is_verified FROM platform_users WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account not registered. Please create an account first.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    // Role check if provided in login request
    if (role) {
      const requestedNormalizedRole = normalizeRole(role);
      if (user.role !== requestedNormalizedRole) {
        let displayRole = user.role === 'RECEIVER' ? 'NGO / Shelter' : user.role.charAt(0) + user.role.slice(1).toLowerCase();
        return res.status(403).json({
          success: false,
          message: `You registered as ${displayRole}. Please select ${displayRole} to log in.`,
        });
      }
    }

    const token = generateToken(user.id, user.role);

    // Fetch user profile data
    let profileData = null;
    if (user.role === 'DONOR') {
      const p = await db.query('SELECT * FROM donor_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    } else if (user.role === 'VOLUNTEER') {
      const p = await db.query('SELECT * FROM volunteer_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    } else if (user.role === 'RECEIVER') {
      const p = await db.query('SELECT * FROM receiver_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    }

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        role: user.role,
        roleKey: user.role === 'RECEIVER' ? 'ngo' : user.role.toLowerCase(),
      },
      profile: profileData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently logged in user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    let profileData = null;
    if (user.role === 'DONOR') {
      const p = await db.query('SELECT * FROM donor_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    } else if (user.role === 'VOLUNTEER') {
      const p = await db.query('SELECT * FROM volunteer_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    } else if (user.role === 'RECEIVER') {
      const p = await db.query('SELECT * FROM receiver_profiles WHERE user_id = $1', [user.id]);
      profileData = p.rows[0] || null;
    }

    res.json({
      success: true,
      user: {
        ...user,
        roleKey: user.role === 'RECEIVER' ? 'ngo' : user.role.toLowerCase(),
      },
      profile: profileData,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city, vehicleType, vehicleNumber, organizationName } = req.body;

    await db.query(
      `UPDATE platform_users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name, phone, address, city, userId]
    );

    if (req.user.role === 'VOLUNTEER' && (vehicleType || vehicleNumber)) {
      await db.query(
        `UPDATE volunteer_profiles
         SET vehicle_type = COALESCE($1, vehicle_type),
             vehicle_number = COALESCE($2, vehicle_number),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [vehicleType, vehicleNumber, userId]
      );
    } else if ((req.user.role === 'DONOR' || req.user.role === 'RECEIVER') && organizationName) {
      const table = req.user.role === 'DONOR' ? 'donor_profiles' : 'receiver_profiles';
      await db.query(
        `UPDATE ${table} SET organization_name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [organizationName, userId]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  normalizeRole,
};
