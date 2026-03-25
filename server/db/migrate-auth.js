/**
 * migrate-auth.js
 * Crea las tablas del sistema de autenticación, roles, permisos y aprobaciones.
 * Ejecutar UNA sola vez: node db/migrate-auth.js
 */
require('dotenv').config()
const pool = require('./index')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── Tabla de calidad (dependencia de aprobaciones) ───────────────────
    // CREATE IF NOT EXISTS: no falla si ya existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS recepciones_calidad (
        id            SERIAL      PRIMARY KEY,
        tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('camaron', 'pescado')),
        nro_recepcion VARCHAR(30) UNIQUE NOT NULL,
        fecha         DATE        NOT NULL,
        hora_llegada  TIME        NOT NULL,
        id_proveedor  INTEGER     REFERENCES proveedores(id_proveedor),
        created_at    TIMESTAMP   DEFAULT NOW()
      )
    `)

    // ── Roles del sistema ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id          SERIAL PRIMARY KEY,
        nombre      VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT
      )
    `)

    // ── Permisos disponibles (vistas e indicadores) ───────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id          SERIAL PRIMARY KEY,
        codigo      VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT        NOT NULL,
        categoria   VARCHAR(50) NOT NULL   -- 'vista' | 'indicador'
      )
    `)

    // ── Permisos por defecto de cada rol ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS rol_permisos (
        rol_id     INT REFERENCES roles(id)   ON DELETE CASCADE,
        permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
        PRIMARY KEY (rol_id, permiso_id)
      )
    `)

    // ── Usuarios del sistema ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id                   SERIAL PRIMARY KEY,
        nombre               VARCHAR(100) NOT NULL,
        email                VARCHAR(150) UNIQUE NOT NULL,
        telefono             VARCHAR(20),
        password_hash        VARCHAR(255) NOT NULL,
        rol_id               INT REFERENCES roles(id),
        activo               BOOLEAN DEFAULT true,
        especie_acceso       VARCHAR(20) DEFAULT 'ambas',  -- 'camaron' | 'pescado' | 'ambas'
        reset_token          VARCHAR(255),
        reset_token_expires  TIMESTAMPTZ,
        created_at           TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── Permisos individuales por usuario (override del rol) ──────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuario_permisos (
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
        activo     BOOLEAN DEFAULT true,
        PRIMARY KEY (usuario_id, permiso_id)
      )
    `)

    // ── Aprobaciones de recepciones de calidad ────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS aprobaciones (
        id                   SERIAL PRIMARY KEY,
        recepcion_calidad_id INT REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
        estado               VARCHAR(20) DEFAULT 'pendiente',  -- pendiente | aprobado | rechazado
        aprobado_por         INT REFERENCES usuarios(id),
        observacion          TEXT,
        fecha_aprobacion     TIMESTAMPTZ,
        created_at           TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('✅ Migración completada — tablas de auth y aprobaciones creadas')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
