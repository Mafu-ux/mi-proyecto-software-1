const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// listar metodos
router.get('/methods', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT * FROM payment_methods ORDER BY name');
  res.json(rows);
});

// crear metodo (admin)
router.post('/methods', verifyToken, authorizeRoles('admin'), async (req,res) => {
  const { name } = req.body;
  await pool.execute('INSERT INTO payment_methods (name) VALUES (?)', [name]);
  res.json({ message:'created' });
});

// registrar pago sobre orden
router.post('/', verifyToken, async (req,res) => {
  const { order_id, payment_method_id, amount } = req.body;
  await pool.execute('INSERT INTO payments (order_id, payment_method_id, amount) VALUES (?,?,?)', [order_id, payment_method_id, amount]);
  res.json({ message:'paid' });
});

module.exports = router;
