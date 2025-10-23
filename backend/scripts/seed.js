// node scripts/seed.js
require('dotenv').config();
const pool = require('../src/db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // admin default
    const email = 'admin@restaurante.com';
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length === 0) {
      const pass = await bcrypt.hash('admin123', 10);
      await pool.execute('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Admin', email, pass, 'admin']);
      console.log('Usuario admin creado: admin@restaurante.com / admin123');
    } else {
      console.log('Admin ya existe');
    }

    // payment methods
    const methods = ['Efectivo','Tarjeta','Nequi','Daviplata'];
    for (const m of methods) {
      const [r] = await pool.execute('SELECT id FROM payment_methods WHERE name = ?', [m]);
      if (r.length === 0) {
        await pool.execute('INSERT INTO payment_methods (name) VALUES (?)', [m]);
      }
    }

    // sample products
    const prod = [
      ['Hamburguesa', 'Comida', 20, 5, 18000],
      ['Pizza', 'Comida', 10, 3, 22000],
      ['Gaseosa', 'Bebida', 50, 10, 4000]
    ];
    for (const p of prod) {
      const [r] = await pool.execute('SELECT id FROM products WHERE name = ?', [p[0]]);
      if (r.length === 0) {
        await pool.execute('INSERT INTO products (name,category,quantity,minimum_stock,price) VALUES (?,?,?,?,?)', p);
      }
    }

    // sample tables
    const [tables] = await pool.execute('SELECT id FROM restaurant_tables');
    if (tables.length === 0) {
      for (let i=1;i<=8;i++){
        await pool.execute('INSERT INTO restaurant_tables (name, capacity) VALUES (?,?)', ['Mesa ' + i, 4]);
      }
    }

    console.log('Seed completado');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
