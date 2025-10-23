const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error de servidor' });
  }
});

// REGISTER (solo admin puede crear via API; se provee seed para primer admin)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // validate
    if (!email || !password || !name) return res.status(400).json({ message: 'Datos incompletos' });
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ message: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    await pool.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, role || 'mesero']);
    res.json({ message: 'Usuario creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error de servidor' });
  }
});

module.exports = router;
