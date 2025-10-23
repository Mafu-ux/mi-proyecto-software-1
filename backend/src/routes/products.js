const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// listar
router.get('/', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT * FROM products ORDER BY name');
  res.json(rows);
});

// low stock
router.get('/low-stock', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT * FROM products WHERE quantity <= minimum_stock ORDER BY quantity ASC');
  res.json(rows);
});

// crear (admin)
router.post('/', verifyToken, authorizeRoles('admin'), async (req,res) => {
  const { name, category, quantity, minimum_stock, price } = req.body;
  await pool.execute('INSERT INTO products (name,category,quantity,minimum_stock,price) VALUES (?,?,?,?,?)',
    [name, category, quantity||0, minimum_stock||0, price||0]);
  res.json({ message:'created' });
});

// actualizar (admin)
router.put('/:id', verifyToken, authorizeRoles('admin'), async (req,res) => {
  const { name, category, quantity, minimum_stock, price } = req.body;
  await pool.execute('UPDATE products SET name=?,category=?,quantity=?,minimum_stock=?,price=? WHERE id=?',
    [name, category, quantity, minimum_stock, price, req.params.id]);
  res.json({ message:'updated' });
});

// eliminar (admin)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req,res) => {
  await pool.execute('DELETE FROM products WHERE id=?', [req.params.id]);
  res.json({ message:'deleted' });
});

module.exports = router;
