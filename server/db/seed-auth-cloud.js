/**
 * seed-auth-cloud.js  —  Semillas para PRODUCCIÓN (Render)
 * Crea tablas e inserta roles, permisos y usuarios iniciales.
 * Incluye CREATE TABLE IF NOT EXISTS — no necesita migrate-auth.js por separado.
 *
 * Ejecutar desde la carpeta server/:
 *   DATABASE_URL="..." node db/seed-auth-cloud.js
 * O con .env configurado:
 *   node db/seed-auth-cloud.js
 *
 * Contraseña por defecto: jjseafoods2026
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool   = require('./index')

const PASSWORD_HASH = bcrypt.hashSync('jjseafoods2026', 10)

const ROLES = [
  { nombre: 'Administrador', descripcion: 'Acceso total + gestión de usuarios y permisos' },
  { nombre: 'Gerente',       descripcion: 'Dashboard completo + registros + aprobaciones' },
  { nombre: 'Operativo',     descripcion: 'Solo registro de productos del mar' },
  { nombre: 'Supervisor',    descripcion: 'Dashboard parcial + registros + aprobaciones' },
]

const PERMISOS = [
  { codigo: 'vista_recepciones',    descripcion: 'Ver listado de recepciones realizadas',    categoria: 'vista' },
  { codigo: 'vista_dashboard',      descripcion: 'Ver el Dashboard',                         categoria: 'vista' },
  { codigo: 'vista_registro',       descripcion: 'Registrar productos del mar',               categoria: 'vista' },
  { codigo: 'vista_aprobacion',     descripcion: 'Revisar registros (revisiones)',            categoria: 'vista' },
  { codigo: 'vista_mantenimientos', descripcion: 'Acceder a los mantenimientos del sistema', categoria: 'vista' },
  { codigo: 'vista_admin',          descripcion: 'Administrar usuarios y permisos',          categoria: 'vista' },
  { codigo: 'ind_general',          descripcion: 'KPIs generales del dashboard',             categoria: 'indicador' },
  { codigo: 'ind_camaron',          descripcion: 'Indicadores específicos camarón',          categoria: 'indicador' },
  { codigo: 'ind_pescado',          descripcion: 'Indicadores específicos pescado',          categoria: 'indicador' },
  { codigo: 'ind_aprobacion',       descripcion: 'Indicadores de aprobaciones',              categoria: 'indicador' },
]

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

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── Crear tablas ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY, nombre VARCHAR(50) UNIQUE NOT NULL, descripcion TEXT
      )`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id SERIAL PRIMARY KEY, codigo VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT NOT NULL, categoria VARCHAR(50) NOT NULL
      )`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        rol_id INT REFERENCES roles(id) ON DELETE CASCADE,
        permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
        PRIMARY KEY (rol_id, permiso_id)
      )`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL, telefono VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL, rol_id INT REFERENCES roles(id),
        activo BOOLEAN DEFAULT true, especie_acceso VARCHAR(20) DEFAULT 'ambas',
        reset_token VARCHAR(255), reset_token_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario_permisos (
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
        activo BOOLEAN DEFAULT true,
        PRIMARY KEY (usuario_id, permiso_id)
      )`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS aprobaciones (
        id SERIAL PRIMARY KEY,
        recepcion_calidad_id INT REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
        estado VARCHAR(20) DEFAULT 'pendiente',
        aprobado_por INT REFERENCES usuarios(id),
        observacion TEXT, fecha_aprobacion TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`)
    console.log('✔ Tablas creadas/verificadas')

    // ── Insertar datos ────────────────────────────────────────────────────
    const rolIds = {}
    for (const rol of ROLES) {
      const r = await client.query(
        `INSERT INTO roles (nombre, descripcion) VALUES ($1,$2)
         ON CONFLICT (nombre) DO UPDATE SET descripcion=EXCLUDED.descripcion RETURNING id`,
        [rol.nombre, rol.descripcion]
      )
      rolIds[rol.nombre] = r.rows[0].id
    }

    const permisoIds = {}
    for (const p of PERMISOS) {
      const r = await client.query(
        `INSERT INTO permisos (codigo, descripcion, categoria) VALUES ($1,$2,$3)
         ON CONFLICT (codigo) DO UPDATE SET descripcion=EXCLUDED.descripcion RETURNING id`,
        [p.codigo, p.descripcion, p.categoria]
      )
      permisoIds[p.codigo] = r.rows[0].id
    }

    for (const [rolNombre, codigos] of Object.entries(ROL_PERMISOS)) {
      for (const codigo of codigos) {
        await client.query(
          `INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [rolIds[rolNombre], permisoIds[codigo]]
        )
      }
    }

    for (const u of USUARIOS) {
      await client.query(
        `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_id, especie_acceso)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (email) DO UPDATE SET
           nombre=EXCLUDED.nombre, telefono=EXCLUDED.telefono,
           rol_id=EXCLUDED.rol_id, especie_acceso=EXCLUDED.especie_acceso`,
        [u.nombre, u.email, u.telefono, PASSWORD_HASH, rolIds[u.rol], u.especie_acceso]
      )
    }

    await client.query('COMMIT')
    console.log('✅ seed-auth-cloud completado.')
    console.log('   Contraseña por defecto: jjseafoods2026')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
