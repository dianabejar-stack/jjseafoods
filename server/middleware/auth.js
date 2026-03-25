/**
 * middleware/auth.js
 * Verifica JWT y adjunta req.user con sus permisos efectivos.
 * Los permisos efectivos = permisos del rol + overrides individuales activos.
 */
const jwt  = require('jsonwebtoken')
const pool = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'jjseafoods_secret_2026'

// ── Query de permisos efectivos por usuario ───────────────────────────────────
const SQL_PERMISOS = `
  SELECT DISTINCT p.codigo
  FROM   permisos p
  JOIN   rol_permisos rp ON rp.permiso_id = p.id
  WHERE  rp.rol_id = $1
  UNION
  SELECT p.codigo
  FROM   permisos p
  JOIN   usuario_permisos up ON up.permiso_id = p.id
  WHERE  up.usuario_id = $2 AND up.activo = true
`

/**
 * requireAuth — verifica el token y carga permisos.
 * Adjunta req.user = { id, nombre, email, rol, rol_id, especie_acceso, permisos[] }
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const payload  = jwt.verify(header.slice(7), JWT_SECRET)
    const permsRes = await pool.query(SQL_PERMISOS, [payload.rol_id, payload.id])

    req.user = { ...payload, permisos: permsRes.rows.map(r => r.codigo) }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

/**
 * requirePermiso(codigo) — middleware de autorización por permiso específico.
 * Usar después de requireAuth.
 */
function requirePermiso(codigo) {
  return (req, res, next) => {
    if (!req.user?.permisos?.includes(codigo)) {
      return res.status(403).json({ error: `Sin permiso: ${codigo}` })
    }
    next()
  }
}

module.exports = { requireAuth, requirePermiso, JWT_SECRET }
