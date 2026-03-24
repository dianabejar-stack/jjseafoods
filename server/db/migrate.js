/**
 * migrate.js
 * Crea las tablas necesarias para el sistema de recepción de calidad.
 * Ejecutar UNA SOLA VEZ: node db/migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')

// Conectar a la misma BD que usa el servidor
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

const SQL = `
-- ─────────────────────────────────────────────────────────────────────────
-- TABLA 1: Cabecera de cada recepción de calidad (camarón o pescado)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recepciones_calidad (
  id             SERIAL       PRIMARY KEY,
  tipo           VARCHAR(10)  NOT NULL CHECK (tipo IN ('camaron', 'pescado')),
  nro_recepcion  VARCHAR(30)  UNIQUE NOT NULL,
  fecha          DATE         NOT NULL,
  hora_llegada   TIME         NOT NULL,
  id_proveedor   INTEGER      REFERENCES proveedores(id_proveedor),
  created_at     TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA 2: Detalle completo del formulario de camarón
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS camaron_recepcion (
  id                    SERIAL PRIMARY KEY,
  id_recepcion          INTEGER REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
  -- Datos generales
  nro_lote              VARCHAR(50),
  nro_gavetas           INTEGER,
  nro_piscina           VARCHAR(20),
  libras_reportadas     NUMERIC(10,2),
  libras_recibidas      NUMERIC(10,2),
  temperatura           NUMERIC(5,2),
  hora_analisis         TIME,
  nombre_chofer         VARCHAR(100),
  nro_guia              VARCHAR(50),
  nro_placa             VARCHAR(20),
  -- Tipo de producto
  presentacion          VARCHAR(30),
  origen                VARCHAR(40),
  especie               VARCHAR(30),
  -- Estado de la muestra
  peso_muestra          NUMERIC(8,2),
  color_camaron         VARCHAR(30),
  gramos                NUMERIC(8,2),
  uniformidad           NUMERIC(5,2),
  juveniles_pct         NUMERIC(5,2),
  so2_ppm               NUMERIC(8,2),
  clasificacion_prom    NUMERIC(8,2),
  basura_pescados       NUMERIC(8,2),
  camaron_leche         NUMERIC(8,2),
  total_defectos        NUMERIC(5,2),
  -- Defectos condición (%)
  def_fresco_sano       NUMERIC(5,2),
  def_flacidez          NUMERIC(5,2),
  def_mudado            NUMERIC(5,2),
  def_quebrado          NUMERIC(5,2),
  def_picado            NUMERIC(5,2),
  def_necrosis          NUMERIC(5,2),
  def_cabeza_floja      NUMERIC(5,2),
  def_cabeza_roja       NUMERIC(5,2),
  def_cabeza_anaranjada NUMERIC(5,2),
  def_hepatopancreas    NUMERIC(5,2),
  -- Defectos adicionales (%)
  def_deforme           NUMERIC(5,2),
  def_deshidratado      NUMERIC(5,2),
  def_deshid_fuerte     NUMERIC(5,2),
  def_melanosis         NUMERIC(5,2),
  def_rosado_rojo       NUMERIC(5,2),
  def_semi_rosado       NUMERIC(5,2),
  def_corbata_grande    NUMERIC(5,2),
  def_corbata_sucia     NUMERIC(5,2),
  def_lodo_branquias    NUMERIC(5,2),
  def_otros             NUMERIC(5,2),
  -- Calidad y ponderación organoléptica
  calidad               VARCHAR(1)  CHECK (calidad IN ('A','B','C','R')),
  org_color             SMALLINT,
  org_olor              SMALLINT,
  org_textura           SMALLINT,
  org_ojos              SMALLINT,
  org_apariencia        SMALLINT,
  org_promedio          NUMERIC(4,2),
  org_clasificacion     VARCHAR(1),
  -- Gramaje y dosificación de metabisulfito
  gramaje_grande        NUMERIC(8,2),
  gramaje_pequeno       NUMERIC(8,2),
  dosis_g_por_lb        NUMERIC(8,3),
  total_metabisulfito   NUMERIC(10,2),
  -- Condiciones de recepción
  contaminacion         BOOLEAN     DEFAULT FALSE,
  condicion_transporte  VARCHAR(10),
  -- Observaciones y firmas
  observaciones         TEXT,
  acciones_correctivas  TEXT,
  supervisor_cc         VARCHAR(100),
  jefe_cc               VARCHAR(100)
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA 3: Cabecera del formulario de pescado
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pescado_recepcion (
  id                   SERIAL PRIMARY KEY,
  id_recepcion         INTEGER REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
  nro_lote             VARCHAR(50),
  presentacion         VARCHAR(30),
  romaneo_numero       VARCHAR(50),
  observaciones        TEXT,
  acciones_correctivas TEXT,
  elaborado_por        VARCHAR(100),
  revisado_por         VARCHAR(100)
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA 4: Una fila por pieza de pescado (control de romaneo y temperatura)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pescado_romaneo (
  id               SERIAL PRIMARY KEY,
  id_recepcion     INTEGER  REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
  hora             TIME,
  codigo           VARCHAR(50),
  id_proveedor     INTEGER  REFERENCES proveedores(id_proveedor),
  especie          VARCHAR(50),
  presentacion     VARCHAR(30),
  peso_lb          NUMERIC(10,2),
  nro_piezas       INTEGER  DEFAULT 1,
  presencia_hielo  BOOLEAN  DEFAULT TRUE,
  temperatura      NUMERIC(5,2),
  objetos_extranos BOOLEAN  DEFAULT FALSE,
  org_color        SMALLINT,
  org_olor         SMALLINT,
  org_textura      SMALLINT,
  org_ojos         SMALLINT,
  org_branquias    SMALLINT,
  calificacion     NUMERIC(4,2),
  clasificacion    VARCHAR(1)
);
`

async function migrar() {
  const client = await pool.connect()
  try {
    console.log('⏳ Creando tablas de calidad...')
    await client.query(SQL)
    console.log('✅ Migración completada. Tablas creadas:')
    console.log('   - recepciones_calidad')
    console.log('   - camaron_recepcion')
    console.log('   - pescado_recepcion')
    console.log('   - pescado_romaneo')
  } catch (err) {
    console.error('❌ Error en migración:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrar()
