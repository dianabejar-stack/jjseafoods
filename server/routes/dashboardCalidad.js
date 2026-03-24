/**
 * dashboardCalidad.js
 * Endpoints analíticos para el Dashboard Filtrado.
 * Consultan las tablas de calidad (recepciones_calidad, camaron_recepcion, pescado_romaneo).
 *
 * GET /api/dashboard/calidad/kpis?tipo=camaron|pescado|all
 * GET /api/dashboard/calidad/tabla-hoy?tipo=camaron|pescado|all
 * GET /api/dashboard/calidad/tendencia?tipo=camaron|pescado|all
 * GET /api/dashboard/calidad/por-especie    (pescado, últimos 30 días)
 * GET /api/dashboard/calidad/por-talla      (camarón, últimos 30 días)
 * GET /api/dashboard/calidad/por-proveedor  (todos, últimos 30 días)
 */
const express = require('express')
const router  = express.Router()
const pool    = require('../db')

// ─── KPIs por tipo ─────────────────────────────────────────────────────────
router.get('/kpis', async (req, res) => {
  const tipo = req.query.tipo || 'all'
  const hoy  = new Date().toISOString().split('T')[0]

  try {
    if (tipo === 'camaron') {
      const lotes   = await pool.query(
        `SELECT COUNT(*) AS total FROM recepciones_calidad
         WHERE tipo = 'camaron' AND fecha = $1`, [hoy])
      const libras  = await pool.query(
        `SELECT COALESCE(SUM(c.libras_recibidas), 0) AS total
         FROM camaron_recepcion c
         JOIN recepciones_calidad rc ON rc.id = c.id_recepcion
         WHERE rc.fecha = $1`, [hoy])
      const calidad = await pool.query(
        `SELECT COALESCE(AVG(c.org_promedio), 0) AS promedio
         FROM camaron_recepcion c
         JOIN recepciones_calidad rc ON rc.id = c.id_recepcion
         WHERE rc.fecha = $1`, [hoy])

      const prom = parseFloat(calidad.rows[0].promedio)
      const clas = prom >= 2.6 ? 'A' : prom >= 2.0 ? 'B' : prom >= 1.5 ? 'C' : prom > 0 ? 'R' : '—'

      res.json({
        lotes:       parseInt(lotes.rows[0].total),
        libras:      parseFloat(libras.rows[0].total).toFixed(0),
        calidad_prom: clas,
        calidad_pts:  prom.toFixed(2),
      })

    } else if (tipo === 'pescado') {
      const lotes  = await pool.query(
        `SELECT COUNT(*) AS total FROM recepciones_calidad
         WHERE tipo = 'pescado' AND fecha = $1`, [hoy])
      const stats  = await pool.query(
        `SELECT COALESCE(SUM(r.peso_lb * 0.453592), 0) AS kg,
                COALESCE(SUM(r.nro_piezas), 0)         AS piezas,
                COALESCE(AVG(r.temperatura), 0)        AS temp_prom
         FROM pescado_romaneo r
         JOIN recepciones_calidad rc ON rc.id = r.id_recepcion
         WHERE rc.fecha = $1`, [hoy])
      const row = stats.rows[0]
      res.json({
        lotes:     parseInt(lotes.rows[0].total),
        kg_total:  parseFloat(row.kg).toFixed(1),
        temp_prom: parseFloat(row.temp_prom).toFixed(1),
        piezas:    parseInt(row.piezas),
      })

    } else {
      // Vista general: combina camarón y pescado
      const totales = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE tipo = 'camaron') AS lotes_camaron,
           COUNT(*) FILTER (WHERE tipo = 'pescado') AS lotes_pescado,
           COUNT(*)                                  AS total,
           COUNT(DISTINCT id_proveedor)              AS proveedores
         FROM recepciones_calidad WHERE fecha = $1`, [hoy])
      const alertasCam = await pool.query(
        `SELECT COUNT(*) AS total
         FROM camaron_recepcion c
         JOIN recepciones_calidad rc ON rc.id = c.id_recepcion
         WHERE rc.fecha = $1
           AND (c.contaminacion = TRUE OR c.condicion_transporte = 'SUCIO')`, [hoy])
      const alertasPes = await pool.query(
        `SELECT COUNT(*) AS total
         FROM pescado_romaneo r
         JOIN recepciones_calidad rc ON rc.id = r.id_recepcion
         WHERE rc.fecha = $1 AND r.objetos_extranos = TRUE`, [hoy])

      const row = totales.rows[0]
      res.json({
        total:         parseInt(row.total),
        lotes_camaron: parseInt(row.lotes_camaron),
        lotes_pescado: parseInt(row.lotes_pescado),
        proveedores:   parseInt(row.proveedores),
        alertas:       parseInt(alertasCam.rows[0].total) + parseInt(alertasPes.rows[0].total),
      })
    }
  } catch (err) {
    console.error('Error en kpis calidad:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── Tabla de recepciones de hoy ───────────────────────────────────────────
router.get('/tabla-hoy', async (req, res) => {
  const tipo = req.query.tipo || 'all'
  const hoy  = new Date().toISOString().split('T')[0]

  try {
    let result
    if (tipo === 'camaron') {
      result = await pool.query(`
        SELECT rc.hora_llegada AS hora, p.nombre AS proveedor,
               c.nro_lote, c.libras_recibidas AS libras,
               c.presentacion, c.calidad, c.total_defectos, c.temperatura
        FROM   camaron_recepcion c
        JOIN   recepciones_calidad rc ON rc.id = c.id_recepcion
        LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
        WHERE  rc.fecha = $1
        ORDER  BY rc.hora_llegada ASC`, [hoy])
    } else if (tipo === 'pescado') {
      result = await pool.query(`
        SELECT r.hora, p.nombre AS proveedor, r.especie,
               r.presentacion, r.peso_lb AS peso, r.temperatura,
               r.calificacion, r.clasificacion, r.objetos_extranos
        FROM   pescado_romaneo r
        JOIN   recepciones_calidad rc ON rc.id = r.id_recepcion
        LEFT   JOIN proveedores p ON p.id_proveedor = r.id_proveedor
        WHERE  rc.fecha = $1
        ORDER  BY r.hora ASC`, [hoy])
    } else {
      result = await pool.query(`
        SELECT rc.tipo, rc.hora_llegada AS hora,
               p.nombre AS proveedor, rc.nro_recepcion
        FROM   recepciones_calidad rc
        LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
        WHERE  rc.fecha = $1
        ORDER  BY rc.hora_llegada ASC`, [hoy])
    }
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Tendencia 7 días ──────────────────────────────────────────────────────
router.get('/tendencia', async (req, res) => {
  const tipo = req.query.tipo || 'all'
  try {
    let result
    if (tipo === 'camaron') {
      result = await pool.query(`
        SELECT rc.fecha,
               COALESCE(SUM(c.libras_recibidas * 0.453592), 0) AS kg
        FROM   recepciones_calidad rc
        JOIN   camaron_recepcion c ON c.id_recepcion = rc.id
        WHERE  rc.fecha >= CURRENT_DATE - INTERVAL '7 days'
        GROUP  BY rc.fecha ORDER BY rc.fecha`)
    } else if (tipo === 'pescado') {
      result = await pool.query(`
        SELECT rc.fecha,
               COALESCE(SUM(r.peso_lb * 0.453592), 0) AS kg
        FROM   recepciones_calidad rc
        JOIN   pescado_romaneo r ON r.id_recepcion = rc.id
        WHERE  rc.fecha >= CURRENT_DATE - INTERVAL '7 days'
        GROUP  BY rc.fecha ORDER BY rc.fecha`)
    } else {
      result = await pool.query(`
        SELECT fecha, COUNT(*) AS kg
        FROM   recepciones_calidad
        WHERE  fecha >= CURRENT_DATE - INTERVAL '7 days'
        GROUP  BY fecha ORDER BY fecha`)
    }
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Por especie (pescado, últimos 30 días) ────────────────────────────────
router.get('/por-especie', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.especie AS nombre,
             ROUND(SUM(r.peso_lb * 0.453592)::numeric, 1) AS kg
      FROM   pescado_romaneo r
      JOIN   recepciones_calidad rc ON rc.id = r.id_recepcion
      WHERE  rc.fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP  BY r.especie
      ORDER  BY kg DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Por presentación/talla (camarón, últimos 30 días) ────────────────────
router.get('/por-talla', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.presentacion AS nombre,
             COALESCE(SUM(c.libras_recibidas), 0) AS kg
      FROM   camaron_recepcion c
      JOIN   recepciones_calidad rc ON rc.id = c.id_recepcion
      WHERE  rc.fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP  BY c.presentacion
      ORDER  BY kg DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Por proveedor (todos, últimos 30 días) ───────────────────────────────
router.get('/por-proveedor', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nombre, COUNT(*) AS recepciones
      FROM   recepciones_calidad rc
      LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      WHERE  rc.fecha >= CURRENT_DATE - INTERVAL '30 days'
        AND  p.nombre IS NOT NULL
      GROUP  BY p.nombre
      ORDER  BY recepciones DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
