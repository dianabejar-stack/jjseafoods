/**
 * migrate-v3.js
 * Migraciones para la versión 3 del sistema JJ SeaFoods:
 *   - Campo es_exportacion en recepciones_calidad
 *   - Campos talla y calidad_proveedor en pescado_romaneo
 *   - Campos tipo_identificacion y numero_identificacion en proveedores
 *   - Nuevas tablas: placas, especies, colores_camaron, empleados
 *   - Nuevos permisos: vista_recepciones, vista_mantenimientos
 * Ejecutar: node db/migrate-v3.js
 */
require('dotenv').config()
const pool = require('./index')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── recepciones_calidad: campo es_exportacion ────────────────────────
    await client.query(`
      ALTER TABLE recepciones_calidad
        ADD COLUMN IF NOT EXISTS es_exportacion BOOLEAN DEFAULT FALSE
    `)

    // ── pescado_romaneo: talla y calidad del proveedor ───────────────────
    await client.query(`
      ALTER TABLE pescado_romaneo
        ADD COLUMN IF NOT EXISTS talla             VARCHAR(20),
        ADD COLUMN IF NOT EXISTS calidad_proveedor VARCHAR(10)
    `)

    // ── proveedores: tipo y número de identificación ─────────────────────
    await client.query(`
      ALTER TABLE proveedores
        ADD COLUMN IF NOT EXISTS tipo_identificacion    VARCHAR(20),
        ADD COLUMN IF NOT EXISTS numero_identificacion  VARCHAR(30)
    `)

    // ── Tabla placas ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS placas (
        id         SERIAL PRIMARY KEY,
        placa      VARCHAR(20) UNIQUE NOT NULL,
        activo     BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── Tabla especies ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS especies (
        id               SERIAL PRIMARY KEY,
        nombre           VARCHAR(100) NOT NULL,
        tipo             VARCHAR(50),
        nombre_cientifico VARCHAR(150),
        activo           BOOLEAN DEFAULT TRUE,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── Tabla colores_camaron ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS colores_camaron (
        id          SERIAL PRIMARY KEY,
        nombre_color VARCHAR(80) UNIQUE NOT NULL,
        activo      BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── Tabla empleados (supervisores y jefes CC) ────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id         SERIAL PRIMARY KEY,
        nombre     VARCHAR(150) NOT NULL,
        cargo      VARCHAR(20) NOT NULL CHECK (cargo IN ('supervisor', 'jefe')),
        activo     BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── Nuevos permisos ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO permisos (codigo, descripcion, categoria)
      VALUES
        ('vista_recepciones',    'Ver listado de recepciones realizadas',   'vista'),
        ('vista_mantenimientos', 'Acceder a los mantenimientos del sistema', 'vista')
      ON CONFLICT (codigo) DO NOTHING
    `)

    // ── Asignar nuevos permisos al rol Administrador ─────────────────────
    await client.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM   roles r, permisos p
      WHERE  r.nombre = 'Administrador'
        AND  p.codigo IN ('vista_recepciones', 'vista_mantenimientos')
      ON CONFLICT DO NOTHING
    `)

    // ── Asignar vista_recepciones al Gerente y Supervisor ────────────────
    await client.query(`
      INSERT INTO rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM   roles r, permisos p
      WHERE  r.nombre IN ('Gerente', 'Supervisor')
        AND  p.codigo = 'vista_recepciones'
      ON CONFLICT DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✅ migrate-v3 completado')
    console.log('   + recepciones_calidad.es_exportacion')
    console.log('   + pescado_romaneo.talla / .calidad_proveedor')
    console.log('   + proveedores.tipo_identificacion / .numero_identificacion')
    console.log('   + tablas: placas, especies, colores_camaron, empleados')
    console.log('   + permisos: vista_recepciones, vista_mantenimientos')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migrate-v3:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
