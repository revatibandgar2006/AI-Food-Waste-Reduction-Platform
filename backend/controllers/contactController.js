const db = require('../config/db');

// @desc    Submit a contact inquiry / message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    // Save to PostgreSQL contact_messages table
    const result = await db.query(
      `INSERT INTO contact_messages (name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, 'NEW')
       RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), subject || 'General Inquiry', message.trim()]
    );

    const savedMessage = result.rows[0];

    // Create an alert notification for Admin
    try {
      const adminRes = await db.query(`SELECT id FROM platform_users WHERE role = 'ADMIN' LIMIT 1`);
      if (adminRes.rows.length > 0) {
        await db.query(
          `INSERT INTO platform_notifications (user_id, title, message, type, related_id)
           VALUES ($1, $2, $3, 'CONTACT', $4)`,
          [
            adminRes.rows[0].id,
            `📩 Inbound Inquiry: ${subject || 'General'}`,
            `From ${name} (${email}): "${message.substring(0, 100)}..."`,
            savedMessage.id,
          ]
        );
      }
    } catch (notifErr) {
      console.warn('Could not post admin notification for contact message:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Thank you, ${name}! Your inquiry has been registered in the foodBridge-AI database (Ticket #${savedMessage.id}).`,
      data: savedMessage,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (ADMIN)
const getAllContactMessages = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50`
    );
    res.json({
      success: true,
      count: result.rows.length,
      messages: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitContactMessage,
  getAllContactMessages,
};
