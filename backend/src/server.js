require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const reservationsRoutes = require('./routes/reservations');
const paymentsRoutes = require('./routes/payments');
const invoicesRoutes = require('./routes/invoices');
const reportsRoutes = require('./routes/reports');

const app = express();
app.use(cors());
app.use(express.json());

// rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);

// health
app.get('/api/health', (req,res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
