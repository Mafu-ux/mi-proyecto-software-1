const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// listar ordenes
router.get('/', verifyToken, async (req,res) => {
  const [rows] = await pool.execute('SELECT o.*, u.name as created_by FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC');
  res.json(rows);
});

// detalle
router.get('/:id', verifyToken, async (req,res) => {
  const [orders] = await pool.execute('SELECT * FROM orders WHERE id=?', [req.params.id]);
  if (!orders.length) return res.status(404).json({ message:'not found' });
  const order = orders[0];
  const [items] = await pool.execute('SELECT oi.*, p.name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE order_id=?',[req.params.id]);
  res.json({ order, items });
});

// crear orden (items = [{product_id, quantity}])
router.post('/', verifyToken, async (req,res) => {
  const { customer_name, type, address, table_id, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message:'No items' });

  // Check stock
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // compute totals and check stock
    let subtotal = 0;
    for (const it of items) {
      const [prodRows] = await conn.execute('SELECT id, name, quantity, price FROM products WHERE id = ?', [it.product_id]);
      if (!prodRows.length) throw new Error(`Producto ${it.product_id} no existe`);
      const product = prodRows[0];
      if (product.quantity < it.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
      subtotal += parseFloat(product.price) * Number(it.quantity);
    }

    // create order
    const [result] = await conn.execute('INSERT INTO orders (customer_name,type,address,table_id,total,user_id) VALUES (?,?,?,?,?,?)',
      [customer_name, type || 'local', address || null, table_id || null, subtotal, req.user.id || null]);
    const orderId = result.insertId;

    // insert items and deduct stock
    for (const it of items) {
      const [prodRows] = await conn.execute('SELECT id, price, quantity FROM products WHERE id = ?', [it.product_id]);
      const product = prodRows[0];
      const price = parseFloat(product.price);
      const subtotalItem = price * it.quantity;
      await conn.execute('INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?,?,?,?,?)',
        [orderId, it.product_id, it.quantity, price, subtotalItem]);
      // deduct
      await conn.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [it.quantity, it.product_id]);
    }

    await conn.commit();
    res.json({ message: 'order_created', orderId });
  } catch (err) {
    await conn.rollback();
    console.error(err.message || err);
    res.status(400).json({ message: err.message || 'Error' });
  } finally {
    conn.release();
  }
});

// cambiar estado de orden
router.put('/:id/status', verifyToken, async (req,res) => {
  const { status } = req.body;
  await pool.execute('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ message:'updated' });
});

module.exports = router;
