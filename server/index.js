require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Autenticación y administración ───────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/usuarios',     require('./routes/usuarios'));
app.use('/api/aprobaciones', require('./routes/aprobaciones'));

// ── Rutas originales ──────────────────────────────────────────────────────
app.use('/api/proveedores',          require('./routes/proveedores'));
app.use('/api/recepciones',          require('./routes/recepciones'));
app.use('/api/dashboard',            require('./routes/dashboard'));

// ── Rutas del sistema de calidad (v2) ────────────────────────────────────
app.use('/api/recepciones-calidad',  require('./routes/recepcionesCalidad'));
app.use('/api/dashboard/calidad',    require('./routes/dashboardCalidad'));

// ── Mantenimientos (v3) ───────────────────────────────────────────────
app.use('/api/mantenimientos',       require('./routes/mantenimientos'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JJ SeaFoods API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
