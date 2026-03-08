const express = require('express');
const router = express.Router();
const pool = require('../db');

// KPIs del día
router.get('/kpis', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const recepciones = await pool.query(
      'SELECT COUNT(*) as total FROM recepciones WHERE fecha = $1', [hoy]
    );
    const kgHoy = await pool.query(
      `SELECT COALESCE(SUM(d.peso_neto), 0) as total_kg
       FROM recepcion_detalle d
       JOIN recepciones r ON r.id_recepcion = d.id_recepcion
       WHERE r.fecha = $1`, [hoy]
    );
    const proveedores = await pool.query(
      `SELECT COUNT(DISTINCT id_proveedor) as total
       FROM recepciones WHERE fecha = $1`, [hoy]
    );
    const piezas = await pool.query(
      `SELECT COALESCE(COUNT(d.id_detalle), 0) as total
       FROM recepcion_detalle d
       JOIN recepciones r ON r.id_recepcion = d.id_recepcion
       WHERE r.fecha = $1`, [hoy]
    );

    res.json({
      recepciones: parseInt(recepciones.rows[0].total),
      kg_hoy: parseFloat(kgHoy.rows[0].total_kg).toFixed(1),
      proveedores: parseInt(proveedores.rows[0].total),
      piezas: parseInt(piezas.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en KPIs' });
  }
});

// Recepcion por especie (últimos 30 días)
router.get('/por-especie', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.producto, ROUND(SUM(d.peso_neto)::numeric, 1) as total_kg
      FROM recepcion_detalle d
      JOIN recepciones r ON r.id_recepcion = d.id_recepcion
      WHERE r.fecha >= NOW() - INTERVAL '30 days'
      GROUP BY d.producto
      ORDER BY total_kg DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en por-especie' });
  }
});

// Recepcion por proveedor (últimos 30 días)
router.get('/por-proveedor', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nombre, ROUND(SUM(d.peso_neto)::numeric, 1) as total_kg
      FROM recepcion_detalle d
      JOIN recepciones r ON r.id_recepcion = d.id_recepcion
      JOIN proveedores p ON p.id_proveedor = r.id_proveedor
      WHERE r.fecha >= NOW() - INTERVAL '30 days'
      GROUP BY p.nombre
      ORDER BY total_kg DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en por-proveedor' });
  }
});

// Recepciones del día (tabla)
router.get('/tabla-hoy', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT
        r.hora,
        p.nombre as proveedor,
        d.producto,
        d.talla,
        d.calidad,
        ROUND(d.peso_neto::numeric, 1) as kg,
        r.numero_recepcion
      FROM recepcion_detalle d
      JOIN recepciones r ON r.id_recepcion = d.id_recepcion
      JOIN proveedores p ON p.id_proveedor = r.id_proveedor
      WHERE r.fecha = $1
      ORDER BY r.hora ASC
    `, [hoy]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en tabla-hoy' });
  }
});

// Alertas
router.get('/alertas', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT
        r.numero_recepcion,
        r.hora,
        p.nombre as proveedor,
        ct.transporte_limpio,
        ct.suficiente_hielo,
        ct.combustible_cerca,
        ct.animales_cerca,
        ct.objetos_cerca
      FROM condiciones_transporte ct
      JOIN recepciones r ON r.id_recepcion = ct.id_recepcion
      JOIN proveedores p ON p.id_proveedor = r.id_proveedor
      WHERE r.fecha = $1
        AND (ct.transporte_limpio = false
          OR ct.suficiente_hielo = false
          OR ct.combustible_cerca = true
          OR ct.animales_cerca = true
          OR ct.objetos_cerca = true)
      ORDER BY r.hora DESC
    `, [hoy]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en alertas' });
  }
});

// Recepcion por talla
router.get('/por-talla', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.producto, d.talla, ROUND(SUM(d.peso_neto)::numeric, 1) as total_kg
      FROM recepcion_detalle d
      JOIN recepciones r ON r.id_recepcion = d.id_recepcion
      WHERE r.fecha >= NOW() - INTERVAL '30 days'
      GROUP BY d.producto, d.talla
      ORDER BY d.producto, total_kg DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en por-talla' });
  }
});

// Tendencia últimos 7 días
router.get('/tendencia', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.fecha::text,
        ROUND(SUM(d.peso_neto)::numeric, 1) as total_kg,
        COUNT(DISTINCT r.id_recepcion) as recepciones
      FROM recepcion_detalle d
      JOIN recepciones r ON r.id_recepcion = d.id_recepcion
      WHERE r.fecha >= NOW() - INTERVAL '7 days'
      GROUP BY r.fecha
      ORDER BY r.fecha ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en tendencia' });
  }
});

module.exports = router;
