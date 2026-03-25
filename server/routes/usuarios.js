/**
 * routes/usuarios.js
 * CRUD de usuarios — solo accesible con permiso 'vista_admin'.
 *
 * GET  /api/usuarios            → lista usuarios con rol y overrides de permisos
 * GET  /api/usuarios/roles      → lista todos los roles
 * GET  /api/usuarios/permisos   → lista todos los permisos del sistema
 * POST /api/usuarios            → crear usuario
 * PUT  /api/usuarios/:id        → actualizar usuario
 * PUT  /api/usuarios/:id/permisos → sobreescribir permisos individuales del usuario
 */
const express = require('express')
const router  = express.Router()
const bcrypt  = require('bcryptjs')
const pool    = require('../db')
const { requireAuth, requirePermiso } = require('../middleware/auth')

// Todos los endpoints requieren auth + permiso de administración
router.use(requireAuth, requirePermiso('vista_admin'))

// ── GET / — lista usuarios ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const usuarios = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.telefono, u.activo,
             u.especie_acceso, u.created_at, ro.nombre AS rol, ro.id AS rol_id
      FROM   usuarios u
      JOIN   roles ro ON ro.id = u.rol_id
      ORDER  BY u.nombre
    `)

    // Permisos individuales (override) por usuario
    const overrides = await pool.query(`
      SELECT up.usuario_id, p.id AS permiso_id, p.codigo,
             p.descripcion, p.categoria, up.activo
      FROM   usuario_permisos up
      JOIN   permisos p ON p.id = up.permiso_id
    `)

    // Agrupar overrides por usuario_id
    const overridesMap = {}
    for (const row of overrides.rows) {
      if (!overridesMap[row.usuario_id]) overridesMap[row.usuario_id] = []
      overridesMap[row.usuario_id].push(row)
    }

    res.json(usuarios.rows.map(u => ({
      ...u,
      permisos_override: overridesMap[u.id] || [],
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// ── GET /roles ────────────────────────────────────────────────────────────────
router.get('/roles', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM roles ORDER BY nombre')
    res.json(r.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' })
  }
})

// ── GET /permisos ─────────────────────────────────────────────────────────────
router.get('/permisos', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM permisos ORDER BY categoria, codigo')
    res.json(r.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener permisos' })
  }
})

// ── POST / — crear usuario ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { nombre, email, telefono, password, rol_id, especie_acceso } = req.body
  if (!nombre || !email || !password || !rol_id) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const r = await pool.query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_id, especie_acceso)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, email, telefono, activo, especie_acceso, rol_id
    `, [nombre, email.toLowerCase().trim(), telefono || null, hash, rol_id, especie_acceso || 'ambas'])

    res.status(201).json(r.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está registrado' })
    console.error(err)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

// ── PUT /:id — actualizar usuario ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { nombre, email, telefono, rol_id, especie_acceso, activo, password } = req.body
  const { id } = req.params

  try {
    let query, params
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
      }
      const hash = await bcrypt.hash(password, 10)
      query  = `UPDATE usuarios SET nombre=$1,email=$2,telefono=$3,rol_id=$4,
                  especie_acceso=$5,activo=$6,password_hash=$7 WHERE id=$8
                RETURNING id,nombre,email,telefono,activo,especie_acceso,rol_id`
      params = [nombre, email.toLowerCase().trim(), telefono || null, rol_id, especie_acceso, activo, hash, id]
    } else {
      query  = `UPDATE usuarios SET nombre=$1,email=$2,telefono=$3,rol_id=$4,
                  especie_acceso=$5,activo=$6 WHERE id=$7
                RETURNING id,nombre,email,telefono,activo,especie_acceso,rol_id`
      params = [nombre, email.toLowerCase().trim(), telefono || null, rol_id, especie_acceso, activo, id]
    }

    const r = await pool.query(query, params)
    if (!r.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(r.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está en uso' })
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// ── PUT /:id/permisos — overrides de permisos individuales ───────────────────
router.put('/:id/permisos', async (req, res) => {
  const { id } = req.params
  const { permisos } = req.body  // [{ permiso_id, activo }]

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Reemplazar todos los overrides existentes
    await client.query('DELETE FROM usuario_permisos WHERE usuario_id = $1', [id])
    for (const p of (permisos || [])) {
      await client.query(
        'INSERT INTO usuario_permisos (usuario_id, permiso_id, activo) VALUES ($1,$2,$3)',
        [id, p.permiso_id, p.activo]
      )
    }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar permisos' })
  } finally {
    client.release()
  }
})

module.exports = router
