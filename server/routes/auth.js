/**
 * routes/auth.js
 * Autenticación: login, recuperación de contraseña y restablecimiento.
 *
 * POST /api/auth/login           → devuelve JWT + datos de usuario
 * POST /api/auth/forgot-password → envía correo con link de recuperación
 * POST /api/auth/reset-password  → establece nueva contraseña con token
 */
const express    = require('express')
const router     = express.Router()
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
const crypto     = require('crypto')
const nodemailer = require('nodemailer')
const pool       = require('../db')
const { JWT_SECRET } = require('../middleware/auth')

// ── Consulta permisos efectivos (rol + overrides) ─────────────────────────────
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

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  try {
    // Buscar usuario con su rol
    const r = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.password_hash,
             u.rol_id, u.activo, u.especie_acceso, ro.nombre AS rol
      FROM   usuarios u
      JOIN   roles ro ON ro.id = u.rol_id
      WHERE  u.email = $1
    `, [email.toLowerCase().trim()])

    const usuario = r.rows[0]
    if (!usuario)         return res.status(401).json({ error: 'Credenciales incorrectas' })
    if (!usuario.activo)  return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' })

    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) return res.status(401).json({ error: 'Credenciales incorrectas' })

    // Cargar permisos efectivos
    const permsRes = await pool.query(SQL_PERMISOS, [usuario.rol_id, usuario.id])
    const permisos = permsRes.rows.map(r => r.codigo)

    // Generar token JWT (8 horas)
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, rol_id: usuario.rol_id, especie_acceso: usuario.especie_acceso },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, especie_acceso: usuario.especie_acceso, permisos,
      },
    })
  } catch (err) {
    console.error('Error en login:', err.message)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// ── POST /forgot-password ─────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })

  try {
    const r = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE email = $1 AND activo = true',
      [email.toLowerCase().trim()]
    )

    // Siempre responder ok para no revelar si el email existe
    if (!r.rows[0]) return res.json({ ok: true })

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, r.rows[0].id]
    )

    // Enviar correo si hay configuración SMTP en variables de entorno
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?reset=${token}`

      await transporter.sendMail({
        from:    `"JJ SeaFoods" <${process.env.SMTP_USER}>`,
        to:      email,
        subject: 'Recuperación de contraseña — JJ SeaFoods',
        html: `
          <p>Hola <strong>${r.rows[0].nombre}</strong>,</p>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Si no solicitaste esto, ignora este correo.</p>
          <hr><p><small>JJ SeaFoods — Sistema de Trazabilidad</small></p>
        `,
      })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Error en forgot-password:', err.message)
    res.status(500).json({ error: 'Error al procesar la solicitud' })
  }
})

// ── POST /reset-password ──────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) {
    return res.status(400).json({ error: 'Token y contraseña requeridos' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {
    const r = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )
    if (!r.rows[0]) return res.status(400).json({ error: 'Token inválido o expirado' })

    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'UPDATE usuarios SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2',
      [hash, r.rows[0].id]
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('Error en reset-password:', err.message)
    res.status(500).json({ error: 'Error al restablecer contraseña' })
  }
})

module.exports = router
