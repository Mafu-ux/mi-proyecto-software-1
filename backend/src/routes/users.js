const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// GET todos (admin)
router.get('/', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users');
  res.json(rows);
});

// GET uno
router.get('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.params.id]);
  res.json(rows[0] || null);
});

// CREATE (admin)
router.post('/', verifyToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) return res.status(400).json({ message: 'Email already' });
  const hash = await bcrypt.hash(password, 10);
  await pool.execute('INSERT INTO users (name,email,password,role) VALUES(?,?,?,?)',[name,email,hash,role||'mesero']);
  res.json({ message:'created' });
});

// DELETE
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req,res) => {
  await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message:'deleted' });
});

module.exports = router;
