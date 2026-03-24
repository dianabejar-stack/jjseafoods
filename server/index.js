require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas originales
app.use('/api/proveedores',          require('./routes/proveedores'));
app.use('/api/recepciones',          require('./routes/recepciones'));
app.use('/api/dashboard',            require('./routes/dashboard'));

// Rutas del sistema de calidad (nuevos formularios)
app.use('/api/recepciones-calidad',  require('./routes/recepcionesCalidad'));
app.use('/api/dashboard/calidad',    require('./routes/dashboardCalidad'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JJ SeaFoods API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
