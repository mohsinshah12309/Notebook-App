const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require("../middleware/fetchUser");

const JWT_SECRET = 'Mohsinisagood$boy'; // Should be in environment variables

// Helper function for consistent error responses
const sendError = (res, status, message) => {
  return res.status(status).json({ success: false, error: message });
};

// ROUTE 1: Register User
router.post('/createuser', [
  body('name', 'Name must be 3+ characters').isLength({ min: 3 }),
  body('email', 'Invalid email').isEmail().normalizeEmail(),
  body('password', 'Password must be 5+ characters').isLength({ min: 5 })
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return sendError(res, 400, "Email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create user
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });

    // Generate JWT
    const authToken = jwt.sign({ userId: user._id }, JWT_SECRET);

    return res.status(201).json({ 
      success: true,
      authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    return sendError(res, 500, "Internal server error");
  }
});

// ROUTE 2: Login User
// Updated login route with better error handling
router.post('/login', [
  body('email', 'Enter a valid email').isEmail().normalizeEmail(),
  body('password', 'Password cannot be blank').exists()
], async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user with password field explicitly selected
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Debug: Check if password exists
    if (!user.password) {
      console.error('User has no password:', user);
      return res.status(500).json({
        success: false,
        error: "Account configuration error"
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Generate JWT
    const authToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    return res.json({ 
      success: true,
      authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack,
      input: req.body
    });
    return res.status(500).json({ 
      success: false, 
      error: "Authentication service unavailable" 
    });
  }
});

// ROUTE 3: Get User Details
router.get('/getuser', fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return sendError(res, 404, "User not found");
    }
    return res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return sendError(res, 500, "Internal server error");
  }
});

module.exports = router;