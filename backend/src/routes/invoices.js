const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// crear factura a partir de order_id, optionally tip
router.post('/', verifyToken, async (req,res) => {
  const { order_id, tip = 0 } = req.body;
  const [orders] = await pool.execute('SELECT * FROM orders WHERE id=?', [order_id]);
  if (!orders.length) return res.status(404).json({ message:'Order not found' });
  const order = orders[0];

  // subtotal: sum(order_items)
  const [items] = await pool.execute('SELECT SUM(subtotal) as subtotal FROM order_items WHERE order_id=?', [order_id]);
  const subtotal = parseFloat(items[0].subtotal || 0);
  const tax = +(subtotal * 0.19).toFixed(2);
  const total = +(subtotal + tax + Number(tip)).toFixed(2);

  // generate invoice_number simple
  const invoiceNumber = 'F-' + Date.now();

  const [result] = await pool.execute('INSERT INTO invoices (order_id, invoice_number, subtotal, tax, tip, total) VALUES (?,?,?,?,?,?)',
    [order_id, invoiceNumber, subtotal, tax, tip, total]);

  res.json({ message:'invoice_created', invoiceId: result.insertId, invoiceNumber, total });
});

// listar facturas
router.get('/', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT i.*, o.customer_name FROM invoices i LEFT JOIN orders o ON i.order_id = o.id ORDER BY i.created_at DESC');
  res.json(rows);
});

module.exports = router;
