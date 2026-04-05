/**
 * seed-auth.js  —  Semillas para entorno LOCAL
 * Inserta roles, permisos y usuarios iniciales.
 * Requiere que migrate-auth.js ya haya sido ejecutado.
 *
 * Ejecutar: node db/seed-auth.js
 * Contraseña por defecto de todos los usuarios: jjseafoods2026
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool   = require('./index')

// ── Datos maestros ────────────────────────────────────────────────────────────

const PASSWORD_HASH = bcrypt.hashSync('jjseafoods2026', 10)

const ROLES = [
  { nombre: 'Administrador', descripcion: 'Acceso total + gestión de usuarios y permisos' },
  { nombre: 'Gerente',       descripcion: 'Dashboard completo + registros + aprobaciones' },
  { nombre: 'Operativo',     descripcion: 'Solo registro de productos del mar' },
  { nombre: 'Supervisor',    descripcion: 'Dashboard parcial + registros + aprobaciones' },
]

const PERMISOS = [
  // Vistas (acceso a páginas)
  { codigo: 'vista_recepciones',    descripcion: 'Ver listado de recepciones realizadas',    categoria: 'vista' },
  { codigo: 'vista_dashboard',      descripcion: 'Ver el Dashboard',                         categoria: 'vista' },
  { codigo: 'vista_registro',       descripcion: 'Registrar productos del mar',               categoria: 'vista' },
  { codigo: 'vista_aprobacion',     descripcion: 'Revisar registros (revisiones)',            categoria: 'vista' },
  { codigo: 'vista_mantenimientos', descripcion: 'Acceder a los mantenimientos del sistema', categoria: 'vista' },
  { codigo: 'vista_admin',          descripcion: 'Administrar usuarios y permisos',          categoria: 'vista' },
  // Indicadores (KPIs visibles en el dashboard)
  { codigo: 'ind_general',      descripcion: 'KPIs generales del dashboard',     categoria: 'indicador' },
  { codigo: 'ind_camaron',      descripcion: 'Indicadores específicos camarón',  categoria: 'indicador' },
  { codigo: 'ind_pescado',      descripcion: 'Indicadores específicos pescado',  categoria: 'indicador' },
  { codigo: 'ind_aprobacion',   descripcion: 'Indicadores de aprobaciones',      categoria: 'indicador' },
]

// Permisos por defecto para cada rol (lista de códigos)
const ROL_PERMISOS = {
  Administrador: ['vista_recepciones', 'vista_dashboard', 'vista_registro', 'vista_aprobacion',
                  'vista_mantenimientos', 'vista_admin',
                  'ind_general', 'ind_camaron', 'ind_pescado', 'ind_aprobacion'],
  Gerente:       ['vista_recepciones', 'vista_dashboard', 'vista_registro', 'vista_aprobacion',
                  'ind_general', 'ind_camaron', 'ind_pescado', 'ind_aprobacion'],
  Operativo:     ['vista_registro'],
  Supervisor:    ['vista_recepciones', 'vista_dashboard', 'vista_registro', 'vista_aprobacion',
                  'ind_general', 'ind_aprobacion'],
}

const USUARIOS = [
  { nombre: 'Linko',    email: 'linko@jjseafoods.com',    telefono: '0990000001', rol: 'Administrador', especie_acceso: 'ambas' },
  { nombre: 'Joffre',   email: 'joffre@jjseafoods.com',   telefono: '0990000002', rol: 'Gerente',       especie_acceso: 'ambas' },
  { nombre: 'Kevin',    email: 'kevin@jjseafoods.com',    telefono: '0990000003', rol: 'Operativo',     especie_acceso: 'ambas' },
  { nombre: 'Gissella', email: 'gissella@jjseafoods.com', telefono: '0990000004', rol: 'Supervisor',    especie_acceso: 'ambas' },
]

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Roles
    const rolIds = {}
    for (const rol of ROLES) {
      const r = await client.query(
        `INSERT INTO roles (nombre, descripcion)
         VALUES ($1, $2)
         ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
         RETURNING id`,
        [rol.nombre, rol.descripcion]
      )
      rolIds[rol.nombre] = r.rows[0].id
    }
    console.log('✔ Roles insertados')

    // 2. Permisos
    const permisoIds = {}
    for (const p of PERMISOS) {
      const r = await client.query(
        `INSERT INTO permisos (codigo, descripcion, categoria)
         VALUES ($1, $2, $3)
         ON CONFLICT (codigo) DO UPDATE SET descripcion = EXCLUDED.descripcion
         RETURNING id`,
        [p.codigo, p.descripcion, p.categoria]
      )
      permisoIds[p.codigo] = r.rows[0].id
    }
    console.log('✔ Permisos insertados')

    // 3. Permisos por rol
    for (const [rolNombre, codigos] of Object.entries(ROL_PERMISOS)) {
      for (const codigo of codigos) {
        await client.query(
          `INSERT INTO rol_permisos (rol_id, permiso_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [rolIds[rolNombre], permisoIds[codigo]]
        )
      }
    }
    console.log('✔ Permisos por rol asignados')

    // 4. Usuarios
    for (const u of USUARIOS) {
      await client.query(
        `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_id, especie_acceso)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           nombre         = EXCLUDED.nombre,
           telefono       = EXCLUDED.telefono,
           rol_id         = EXCLUDED.rol_id,
           especie_acceso = EXCLUDED.especie_acceso`,
        [u.nombre, u.email, u.telefono, PASSWORD_HASH, rolIds[u.rol], u.especie_acceso]
      )
    }
    console.log('✔ Usuarios insertados')

    await client.query('COMMIT')
    console.log('\n✅ Seed auth completado.')
    console.log('   Contraseña por defecto: jjseafoods2026')
    console.log('   Usuarios: linko | joffre | kevin | gissella  @jjseafoods.com')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en seed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
