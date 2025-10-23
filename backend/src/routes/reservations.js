const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// listar reservas (autenticado)
router.get('/', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT r.*, t.name as table_name FROM reservations r LEFT JOIN restaurant_tables t ON r.table_id = t.id ORDER BY r.date, r.time');
  res.json(rows);
});

// crear reserva (verifica conflicto)
router.post('/', verifyToken, async (req,res) => {
  const { customer_name, phone, date, time, persons, table_id } = req.body;
  if (!customer_name || !date || !time) return res.status(400).json({ message:'Datos incompletos' });

  // conflicto simple: misma tabla, misma fecha y misma hora
  if (table_id) {
    const [conf] = await pool.execute('SELECT id FROM reservations WHERE table_id=? AND date=? AND time=? AND status != "cancelled"', [table_id, date, time]);
    if (conf.length) return res.status(400).json({ message: 'Mesa ya reservada en esa fecha/hora' });
  }

  await pool.execute('INSERT INTO reservations (customer_name,phone,date,time,persons,table_id) VALUES (?,?,?,?,?,?)',[customer_name,phone,date,time,persons||1,table_id||null]);
  res.json({ message:'created' });
});

// actualizar estado
router.put('/:id', verifyToken, async (req,res) => {
  const { status } = req.body;
  await pool.execute('UPDATE reservations SET status=? WHERE id=?',[status, req.params.id]);
  res.json({ message:'updated' });
});

// eliminar
router.delete('/:id', verifyToken, async (req,res) => {
  await pool.execute('DELETE FROM reservations WHERE id=?',[req.params.id]);
  res.json({ message:'deleted' });
});

module.exports = router;
