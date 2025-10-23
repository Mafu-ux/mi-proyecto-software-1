const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// ventas por día (filtro optional: from, to in YYYY-MM-DD)
router.get('/sales', verifyToken, authorizeRoles('admin'), async (req,res) => {
  const { from, to } = req.query;
  let sql = `SELECT DATE(created_at) as day, SUM(total) as total_sales, COUNT(*) as orders_count
             FROM orders WHERE status <> 'cancelled'`;
  const params = [];
  if (from) { sql += ' AND DATE(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND DATE(created_at) <= ?'; params.push(to); }
  sql += ' GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
});

// ventas por método de pago
router.get('/by-method', verifyToken, authorizeRoles('admin'), async (req,res) => {
  const [rows] = await pool.execute(`SELECT pm.name, SUM(p.amount) as total
    FROM payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
    GROUP BY pm.name`);
  res.json(rows);
});

module.exports = router;
