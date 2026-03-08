const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET todos los proveedores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM proveedores ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// POST crear proveedor
router.post('/', async (req, res) => {
  const { nombre, ruc, telefono, direccion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO proveedores (nombre, ruc, telefono, direccion) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, ruc, telefono, direccion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

module.exports = router;
