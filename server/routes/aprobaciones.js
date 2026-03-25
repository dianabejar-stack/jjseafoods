/**
 * routes/aprobaciones.js
 * Gestión de aprobaciones de recepciones de calidad.
 *
 * GET /api/aprobaciones        → lista con filtros opcionales ?estado=&tipo=
 * GET /api/aprobaciones/kpis   → indicadores de aprobaciones
 * PUT /api/aprobaciones/:id    → aprobar o rechazar un registro
 */
const express = require('express')
const router  = express.Router()
const pool    = require('../db')
const { requireAuth, requirePermiso } = require('../middleware/auth')

router.use(requireAuth)

// ── GET / — lista aprobaciones ────────────────────────────────────────────────
router.get('/', requirePermiso('vista_aprobacion'), async (req, res) => {
  const { estado, tipo } = req.query
  const params = []
  const where  = []

  if (estado && estado !== 'todos') { params.push(estado); where.push(`a.estado = $${params.length}`) }
  if (tipo   && tipo   !== 'todos') { params.push(tipo);   where.push(`rc.tipo  = $${params.length}`) }

  const clausula = where.length ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const r = await pool.query(`
      SELECT a.id, a.estado, a.observacion, a.fecha_aprobacion, a.created_at,
             rc.id AS recepcion_id, rc.tipo, rc.nro_recepcion, rc.fecha, rc.hora_llegada,
             p.nombre AS proveedor,
             u.nombre AS aprobado_por_nombre
      FROM   aprobaciones a
      JOIN   recepciones_calidad rc ON rc.id = a.recepcion_calidad_id
      LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      LEFT   JOIN usuarios u    ON u.id = a.aprobado_por
      ${clausula}
      ORDER  BY a.created_at DESC
      LIMIT  200
    `, params)
    res.json(r.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener aprobaciones' })
  }
})

// ── GET /kpis — indicadores de aprobaciones ───────────────────────────────────
router.get('/kpis', requirePermiso('ind_aprobacion'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*)                                                           AS total,
        COUNT(*) FILTER (WHERE a.estado = 'pendiente')                    AS pendientes,
        COUNT(*) FILTER (WHERE a.estado = 'aprobado')                     AS aprobados,
        COUNT(*) FILTER (WHERE a.estado = 'rechazado')                    AS rechazados,
        COUNT(*) FILTER (WHERE DATE(a.created_at) = CURRENT_DATE)         AS registros_hoy,
        COUNT(*) FILTER (WHERE a.estado = 'aprobado'
                           AND DATE(a.fecha_aprobacion) = CURRENT_DATE)   AS aprobados_hoy,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE a.estado = 'aprobado')
          / NULLIF(COUNT(*) FILTER (WHERE a.estado != 'pendiente'), 0), 1
        )                                                                  AS tasa_aprobacion
      FROM aprobaciones a
    `)
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener KPIs de aprobaciones' })
  }
})

// ── GET /:id/detalle — detalle completo de una recepción ─────────────────────
router.get('/:id/detalle', requirePermiso('vista_aprobacion'), async (req, res) => {
  try {
    // Obtener cabecera de la aprobación + recepción
    const cab = await pool.query(`
      SELECT a.id, a.estado, a.observacion, a.fecha_aprobacion,
             rc.id AS recepcion_id, rc.tipo, rc.nro_recepcion, rc.fecha, rc.hora_llegada,
             p.nombre AS proveedor, u.nombre AS aprobado_por_nombre
      FROM   aprobaciones a
      JOIN   recepciones_calidad rc ON rc.id = a.recepcion_calidad_id
      LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      LEFT   JOIN usuarios u   ON u.id = a.aprobado_por
      WHERE  a.id = $1
    `, [req.params.id])

    if (!cab.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' })

    const { tipo, recepcion_id } = cab.rows[0]
    let detalle = null

    if (tipo === 'camaron') {
      const r = await pool.query(
        'SELECT * FROM camaron_recepcion WHERE id_recepcion = $1',
        [recepcion_id]
      )
      detalle = r.rows[0] || null
    } else if (tipo === 'pescado') {
      const rCab = await pool.query(
        'SELECT * FROM pescado_recepcion WHERE id_recepcion = $1',
        [recepcion_id]
      )
      const rRom = await pool.query(
        'SELECT * FROM pescado_romaneo WHERE id_recepcion = $1 ORDER BY id',
        [recepcion_id]
      )
      detalle = { cabecera: rCab.rows[0] || null, romaneo: rRom.rows }
    }

    res.json({ ...cab.rows[0], detalle })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener detalle' })
  }
})

// ── PUT /:id — aprobar o rechazar ─────────────────────────────────────────────
router.put('/:id', requirePermiso('vista_aprobacion'), async (req, res) => {
  const { estado, observacion } = req.body
  if (!['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado debe ser "aprobado" o "rechazado"' })
  }

  try {
    const r = await pool.query(`
      UPDATE aprobaciones
      SET    estado=$1, observacion=$2, aprobado_por=$3, fecha_aprobacion=NOW()
      WHERE  id=$4
      RETURNING *
    `, [estado, observacion || null, req.user.id, req.params.id])

    if (!r.rows[0]) return res.status(404).json({ error: 'Registro no encontrado' })
    res.json(r.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al procesar aprobación' })
  }
})

module.exports = router
