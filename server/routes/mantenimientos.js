/**
 * routes/mantenimientos.js
 * CRUD para las tablas de mantenimiento del sistema.
 *
 * /api/mantenimientos/placas
 * /api/mantenimientos/especies
 * /api/mantenimientos/colores-camaron
 * /api/mantenimientos/empleados          ?cargo=supervisor|jefe
 * /api/mantenimientos/proveedores
 */
const express = require('express')
const router  = express.Router()
const pool    = require('../db')
const { requireAuth, requirePermiso } = require('../middleware/auth')

router.use(requireAuth, requirePermiso('vista_mantenimientos'))

// ═══════════════════════════════════════════════════════════════════════
// PLACAS
// ═══════════════════════════════════════════════════════════════════════
router.get('/placas', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM placas ORDER BY placa')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/placas', async (req, res) => {
  const { placa } = req.body
  if (!placa) return res.status(400).json({ error: 'Placa requerida' })
  try {
    const r = await pool.query(
      'INSERT INTO placas (placa) VALUES ($1) RETURNING *',
      [placa.toUpperCase().trim()]
    )
    res.status(201).json(r.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Placa ya existe' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/placas/:id', async (req, res) => {
  const { placa, activo } = req.body
  try {
    const r = await pool.query(
      'UPDATE placas SET placa=$1, activo=$2 WHERE id=$3 RETURNING *',
      [placa?.toUpperCase().trim(), activo ?? true, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' })
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/placas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM placas WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════
// ESPECIES
// ═══════════════════════════════════════════════════════════════════════
router.get('/especies', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM especies ORDER BY nombre')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/especies', async (req, res) => {
  const { nombre, tipo, nombre_cientifico } = req.body
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
  try {
    const r = await pool.query(
      'INSERT INTO especies (nombre, tipo, nombre_cientifico) VALUES ($1,$2,$3) RETURNING *',
      [nombre.trim(), tipo?.trim() || null, nombre_cientifico?.trim() || null]
    )
    res.status(201).json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/especies/:id', async (req, res) => {
  const { nombre, tipo, nombre_cientifico, activo } = req.body
  try {
    const r = await pool.query(
      'UPDATE especies SET nombre=$1, tipo=$2, nombre_cientifico=$3, activo=$4 WHERE id=$5 RETURNING *',
      [nombre, tipo || null, nombre_cientifico || null, activo ?? true, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' })
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/especies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM especies WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════
// COLORES CAMARÓN
// ═══════════════════════════════════════════════════════════════════════
router.get('/colores-camaron', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM colores_camaron ORDER BY nombre_color')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/colores-camaron', async (req, res) => {
  const { nombre_color } = req.body
  if (!nombre_color) return res.status(400).json({ error: 'Nombre requerido' })
  try {
    const r = await pool.query(
      'INSERT INTO colores_camaron (nombre_color) VALUES ($1) RETURNING *',
      [nombre_color.trim()]
    )
    res.status(201).json(r.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Color ya existe' })
    res.status(500).json({ error: err.message })
  }
})

router.put('/colores-camaron/:id', async (req, res) => {
  const { nombre_color, activo } = req.body
  try {
    const r = await pool.query(
      'UPDATE colores_camaron SET nombre_color=$1, activo=$2 WHERE id=$3 RETURNING *',
      [nombre_color, activo ?? true, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' })
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/colores-camaron/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM colores_camaron WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════
// EMPLEADOS (supervisores y jefes)
// ═══════════════════════════════════════════════════════════════════════
router.get('/empleados', async (req, res) => {
  const { cargo } = req.query
  try {
    const params = []
    const where  = cargo ? [`cargo = $1`] : []
    if (cargo) params.push(cargo)
    const r = await pool.query(
      `SELECT * FROM empleados ${where.length ? 'WHERE ' + where[0] : ''} ORDER BY nombre`,
      params
    )
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/empleados', async (req, res) => {
  const { nombre, cargo } = req.body
  if (!nombre || !cargo) return res.status(400).json({ error: 'Nombre y cargo requeridos' })
  if (!['supervisor', 'jefe'].includes(cargo)) {
    return res.status(400).json({ error: 'Cargo debe ser supervisor o jefe' })
  }
  try {
    const r = await pool.query(
      'INSERT INTO empleados (nombre, cargo) VALUES ($1,$2) RETURNING *',
      [nombre.trim(), cargo]
    )
    res.status(201).json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/empleados/:id', async (req, res) => {
  const { nombre, cargo, activo } = req.body
  try {
    const r = await pool.query(
      'UPDATE empleados SET nombre=$1, cargo=$2, activo=$3 WHERE id=$4 RETURNING *',
      [nombre, cargo, activo ?? true, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' })
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/empleados/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM empleados WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════
// PROVEEDORES (extendido con tipo/número identificación)
// ═══════════════════════════════════════════════════════════════════════
router.get('/proveedores', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM proveedores ORDER BY nombre')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/proveedores', async (req, res) => {
  const { nombre, tipo_identificacion, numero_identificacion, direccion, telefono } = req.body
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
  try {
    const r = await pool.query(
      `INSERT INTO proveedores (nombre, tipo_identificacion, numero_identificacion, direccion, telefono)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre.trim(), tipo_identificacion || null, numero_identificacion || null,
       direccion || null, telefono || null]
    )
    res.status(201).json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/proveedores/:id', async (req, res) => {
  const { nombre, tipo_identificacion, numero_identificacion, direccion, telefono } = req.body
  try {
    const r = await pool.query(
      `UPDATE proveedores
       SET nombre=$1, tipo_identificacion=$2, numero_identificacion=$3,
           direccion=$4, telefono=$5
       WHERE id_proveedor=$6 RETURNING *`,
      [nombre, tipo_identificacion || null, numero_identificacion || null,
       direccion || null, telefono || null, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' })
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/proveedores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM proveedores WHERE id_proveedor=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
