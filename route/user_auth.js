const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { readUsersDB, writeUsersDB } = require('../utils/dbHelpers');
const { ValidationError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * [POST] /auth/register
 * Creates a new user with a hashed password.
 */
router.post("/auth/register", async (req, res, next) => {
  try {
    const { employee_id, email, password, role } = req.body;
    const saltRounds = 10; // Standard for bcrypt

    if (!employee_id || !email || !password || !role) {
      throw new ValidationError("employee_id, email, password, and role are required.");
    }

    // Role validation
    if (role !== 'admin' && role !== 'employee') {
      throw new ValidationError("Role must be 'admin' or 'employee'.");
    }

    const usersDB = readUsersDB(); // user.json (mock flow)
    if (usersDB.find(u => u.email === email)) {
      return res.status(409).send({ error: "User with this email already exists." });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = {
      employee_id,
      email,
      password_hash,
      role
    };

    usersDB.push(newUser);
    writeUsersDB(usersDB); // user.json (mock flow)

    // Do NOT send the hash back in the response
    res.status(201).send({
      message: "User registered successfully.",
      employee_id,
      email,
      role
    });

  } catch (error) {
    next(error);
  }
});

/**
 * [POST] /auth/login
 * Logs in a user and returns a JWT.
 */
router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email and password are required.");
    }

    const usersDB = readUsersDB();
    const user = usersDB.find(u => u.email === email);

    if (!user) {
      return res.status(401).send({ error: "Invalid email or password." });
    }

    // Compare submitted password with stored hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).send({ error: "Invalid email or password." });
    }

    // Create JWT payload
    const payload = {
      employee_id: user.employee_id,
      email: user.email,
      role: user.role
    };

    // Sign the token, set it to expire in 1 hour
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({
      message: "Login successful",
      token: token
    });

  } catch (error) {
    next(error);
  }
});
