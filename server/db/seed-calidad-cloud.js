/**
 * seed-calidad-cloud.js
 * Pobla las tablas de calidad con 60 días de datos históricos + recepciones de hoy.
 * Ejecutar desde la carpeta server/:
 *   node db/seed-calidad-cloud.js
 *
 * REQUISITO: ejecutar primero node db/seed-cloud.js (que crea los proveedores)
 *            y node db/migrate.js (que crea las tablas de calidad).
 */

const { Pool } = require('pg')

// ── Conexión directa a Render (misma cadena que seed-cloud.js) ──────────────
const DATABASE_URL =
  'postgresql://jjseafoods_db_user:BTJq5u04yStKFZ5nJfKUYZIH8oiuthqg@dpg-d6mvr6s50q8c73as0avg-a.oregon-postgres.render.com/jjseafoods_db'

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ────────────────────────────────────────────────────────────────────────────
// CATÁLOGOS
// ────────────────────────────────────────────────────────────────────────────

const RESPONSABLES = ['Gissella Reyes', 'Paula Copete', 'Gabriela Mera', 'Ismael Mina']
const CHOFERES     = ['Carlos Benítez', 'Luis Vera', 'Rodrigo Pita', 'Miguel Suárez']
const ORIGENES     = ['Esmeraldas', 'Muisne', 'Atacames', 'Lagarto', 'Tonchigüe']

// Tallas de camarón con volúmenes de libras típicos y peso relativo de aparición
const TALLAS = [
  { nombre: '41/50',   libMin:  3000, libMax: 12000, peso: 0.28 },
  { nombre: '61/70',   libMin:  1500, libMax:  7000, peso: 0.25 },
  { nombre: '71/90',   libMin:  1000, libMax:  5000, peso: 0.20 },
  { nombre: '91/110',  libMin:   500, libMax:  3000, peso: 0.15 },
  { nombre: '130/150', libMin:   300, libMax:  2000, peso: 0.08 },
  { nombre: 'Semilla', libMin:   100, libMax:   800, peso: 0.04 },
]

// Especies de pescado con pesos típicos por pieza en libras
const ESPECIES = [
  { nombre: 'Tuna YF',    presentaciones: ['H&G', 'WR'],           pesoMin: 120, pesoMax: 380, peso: 0.30 },
  { nombre: 'Dorado',     presentaciones: ['H&G', 'Fillet'],        pesoMin:  25, pesoMax: 130, peso: 0.25 },
  { nombre: 'Wahoo',      presentaciones: ['H&G', 'WR'],            pesoMin:  35, pesoMax: 140, peso: 0.20 },
  { nombre: 'Mahi Mahi',  presentaciones: ['H&G', 'Entero'],        pesoMin:  20, pesoMax:  85, peso: 0.12 },
  { nombre: 'Pargo Seda', presentaciones: ['Entero', 'H&G'],        pesoMin:   6, pesoMax:  28, peso: 0.08 },
  { nombre: 'Espada',     presentaciones: ['H&G', 'WR'],            pesoMin:  80, pesoMax: 220, peso: 0.05 },
]

// ────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────────────────────────

const rand  = (min, max)     => Math.floor(Math.random() * (max - min + 1)) + min
const randF = (min, max, d=2)=> parseFloat((Math.random() * (max - min) + min).toFixed(d))
const pick  = (arr)          => arr[Math.floor(Math.random() * arr.length)]

// Elige talla/especie con distribución ponderada
function pickPonderado(catalogo) {
  const r = Math.random(); let acum = 0
  for (const item of catalogo) { acum += item.peso; if (r <= acum) return item }
  return catalogo[0]
}

// Fecha 'YYYY-MM-DD' hace N días
function fechaStr(diasAtras) {
  const d = new Date(); d.setDate(d.getDate() - diasAtras)
  return d.toISOString().split('T')[0]
}

// Score organoléptico 0–3, sesgado según calidad
const orgScore = (calBuena) => pick(calBuena ? [2, 2, 3, 3, 3] : [1, 1, 2, 2])

// Calidad organoléptica según promedio
function clasificarOrg(prom) {
  if (prom >= 2.6) return 'A'
  if (prom >= 2.0) return 'B'
  if (prom >= 1.5) return 'C'
  return 'R'
}

// Contador global para números de recepción únicos
let contador = 1

function generarNroRecepcion(tipo, fecha) {
  const ymd = fecha.replace(/-/g, '')
  const pfx  = tipo === 'camaron' ? 'CAM' : 'PES'
  return `${pfx}-${ymd}-${String(contador++).padStart(4, '0')}`
}

// ────────────────────────────────────────────────────────────────────────────
// INSERTAR RECEPCIÓN DE CAMARÓN
// ────────────────────────────────────────────────────────────────────────────

async function insertarCamaron(client, { fecha, hora, provId, calBuena = true }) {
  const nroRecepcion = generarNroRecepcion('camaron', fecha)

  // 1) Cabecera en recepciones_calidad
  const { rows } = await client.query(
    `INSERT INTO recepciones_calidad (tipo, nro_recepcion, fecha, hora_llegada, id_proveedor)
     VALUES ('camaron', $1, $2, $3, $4) RETURNING id`,
    [nroRecepcion, fecha, hora, provId]
  )
  const rcId = rows[0].id

  const talla   = pickPonderado(TALLAS)
  const libras  = randF(talla.libMin, talla.libMax, 0)
  const temp    = randF(0.5, calBuena ? 2.8 : 3.9, 1)
  const origen  = pick(ORIGENES)

  // Scores organolépticos (5 características)
  const s = Array.from({ length: 5 }, () => orgScore(calBuena))
  const orgProm = parseFloat((s.reduce((a, b) => a + b) / 5).toFixed(2))
  const calidad = clasificarOrg(orgProm)

  // Defectos — menores para calidad A
  const maxDef = calidad === 'A' ? 3 : calidad === 'B' ? 8 : 15
  const def = {
    frescoSano:     randF(85, 98, 1),
    flacidez:       randF(0, maxDef,     1),
    mudado:         randF(0, maxDef / 2, 1),
    quebrado:       randF(0, maxDef,     1),
    picado:         randF(0, maxDef / 3, 1),
    necrosis:       randF(0, maxDef / 4, 1),
    cabezaFloja:    randF(0, maxDef / 2, 1),
    cabezaRoja:     randF(0, maxDef / 3, 1),
    cabezaNaranja:  randF(0, maxDef / 3, 1),
    hepatopancreas: randF(0, maxDef / 4, 1),
    deforme:        randF(0, maxDef / 3, 1),
    deshidratado:   randF(0, maxDef / 3, 1),
    deshidFuerte:   randF(0, maxDef / 4, 1),
    melanosis:      randF(0, maxDef / 2, 1),
    rosadoRojo:     randF(0, maxDef / 4, 1),
    semiRosado:     randF(0, maxDef / 4, 1),
    corbataGrande:  randF(0, maxDef / 4, 1),
    corbataSucia:   randF(0, maxDef / 4, 1),
    lodoBranquias:  randF(0, maxDef / 3, 1),
    otros:          randF(0, maxDef / 4, 1),
  }
  const totalDefectos = parseFloat(
    Object.entries(def)
      .filter(([k]) => k !== 'frescoSano')
      .reduce((s, [, v]) => s + v, 0)
      .toFixed(2)
  )

  // Gramaje y dosis de metabisulfito (g/lb → total en g)
  const gramGrande  = randF(20, 60, 1)
  const gramPequeno = randF(10, 40, 1)
  const dosisGLb    = randF(0.5, 1.5, 3)
  const totalMeta   = parseFloat((libras * dosisGLb).toFixed(2))

  const condTrans = (!calBuena && Math.random() > 0.5) ? 'SUCIO' : 'LIMPIO'

  // 2) Detalle en camaron_recepcion
  await client.query(`
    INSERT INTO camaron_recepcion (
      id_recepcion, nro_lote, libras_reportadas, libras_recibidas, temperatura,
      hora_analisis, nombre_chofer, nro_guia, nro_placa,
      presentacion, especie, origen,
      total_defectos, def_fresco_sano,
      def_flacidez, def_mudado, def_quebrado, def_picado, def_necrosis,
      def_cabeza_floja, def_cabeza_roja, def_cabeza_anaranjada, def_hepatopancreas,
      def_deforme, def_deshidratado, def_deshid_fuerte, def_melanosis,
      def_rosado_rojo, def_semi_rosado, def_corbata_grande, def_corbata_sucia,
      def_lodo_branquias, def_otros,
      calidad,
      org_color, org_olor, org_textura, org_ojos, org_apariencia,
      org_promedio, org_clasificacion,
      gramaje_grande, gramaje_pequeno, dosis_g_por_lb, total_metabisulfito,
      condicion_transporte, supervisor_cc, jefe_cc
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
      $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48
    )`,
    [
      rcId,
      `LOTE-${nroRecepcion}`,
      libras + randF(0, 80, 0),     // libras reportadas (siempre >= recibidas)
      libras,
      temp,
      hora,
      pick(CHOFERES),
      `GDE-${String(rand(1000, 9999))}`,
      `GBE-${String(rand(100, 999))}-${pick(['A','B','C','D'])}`,
      // presentacion = talla (ej. "41/50")
      talla.nombre,
      'Penaeus vannamei',
      origen,
      totalDefectos, def.frescoSano,
      def.flacidez, def.mudado, def.quebrado, def.picado, def.necrosis,
      def.cabezaFloja, def.cabezaRoja, def.cabezaNaranja, def.hepatopancreas,
      def.deforme, def.deshidratado, def.deshidFuerte, def.melanosis,
      def.rosadoRojo, def.semiRosado, def.corbataGrande, def.corbataSucia,
      def.lodoBranquias, def.otros,
      calidad,
      s[0], s[1], s[2], s[3], s[4],
      orgProm, calidad,
      gramGrande, gramPequeno, dosisGLb, totalMeta,
      condTrans,
      pick(RESPONSABLES),
      pick(RESPONSABLES),
    ]
  )
}

// ────────────────────────────────────────────────────────────────────────────
// INSERTAR RECEPCIÓN DE PESCADO
// ────────────────────────────────────────────────────────────────────────────

async function insertarPescado(client, { fecha, hora, provId, calBuena = true }) {
  const nroRecepcion = generarNroRecepcion('pescado', fecha)
  const especie = pickPonderado(ESPECIES)

  // 1) Cabecera en recepciones_calidad
  const { rows } = await client.query(
    `INSERT INTO recepciones_calidad (tipo, nro_recepcion, fecha, hora_llegada, id_proveedor)
     VALUES ('pescado', $1, $2, $3, $4) RETURNING id`,
    [nroRecepcion, fecha, hora, provId]
  )
  const rcId = rows[0].id

  const presentacion = pick(especie.presentaciones)
  const elaboradoPor = pick(RESPONSABLES)
  const revisadoPor  = pick(RESPONSABLES)

  // 2) Cabecera en pescado_recepcion
  await client.query(
    `INSERT INTO pescado_recepcion
       (id_recepcion, nro_lote, presentacion, romaneo_numero, elaborado_por, revisado_por)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [rcId, `LOTE-${nroRecepcion}`, presentacion, `ROM-${nroRecepcion}`, elaboradoPor, revisadoPor]
  )

  // 3) Piezas individuales en pescado_romaneo
  const numPiezas = rand(1, 6)
  for (let p = 0; p < numPiezas; p++) {
    const temp = randF(0.5, calBuena ? 2.8 : 3.9, 1)

    // 5 scores organolépticos
    const s = Array.from({ length: 5 }, () => orgScore(calBuena))
    const calificacion  = parseFloat((s.reduce((a, b) => a + b) / 5).toFixed(2))
    const clasificacion = clasificarOrg(calificacion)

    // Objetos extraños solo aparecen en recepciones con problemas
    const objetosExtranos = !calBuena && Math.random() > 0.65

    await client.query(`
      INSERT INTO pescado_romaneo (
        id_recepcion, hora, codigo, id_proveedor,
        especie, presentacion, peso_lb, nro_piezas,
        presencia_hielo, temperatura, objetos_extranos,
        org_color, org_olor, org_textura, org_ojos, org_branquias,
        calificacion, clasificacion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        rcId,
        hora,
        `${especie.nombre.substring(0, 3).toUpperCase()}-${fecha.replace(/-/g,'')}-${String(p + 1).padStart(2,'0')}`,
        provId,
        especie.nombre,
        presentacion,
        randF(especie.pesoMin, especie.pesoMax, 1),
        rand(1, 3),
        !objetosExtranos,          // con hielo si no hay problema
        temp,
        objetosExtranos,
        s[0], s[1], s[2], s[3], s[4],
        calificacion,
        clasificacion,
      ]
    )
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Conectando a Render...')
  const client = await pool.connect()

  try {
    // Crear tablas si no existen (equivalente a migrate.js, seguro correrlo varias veces)
    console.log('⏳ Verificando / creando tablas de calidad...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS recepciones_calidad (
        id             SERIAL       PRIMARY KEY,
        tipo           VARCHAR(10)  NOT NULL CHECK (tipo IN ('camaron', 'pescado')),
        nro_recepcion  VARCHAR(30)  UNIQUE NOT NULL,
        fecha          DATE         NOT NULL,
        hora_llegada   TIME         NOT NULL,
        id_proveedor   INTEGER      REFERENCES proveedores(id_proveedor),
        created_at     TIMESTAMP    DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS camaron_recepcion (
        id                    SERIAL PRIMARY KEY,
        id_recepcion          INTEGER REFERENCES recepciones_calidad(id) ON DELETE CASCADE,
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
        presentacion          VARCHAR(30),
        origen                VARCHAR(40),
        especie               VARCHAR(30),
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
        calidad               VARCHAR(1)  CHECK (calidad IN ('A','B','C','R')),
        org_color             SMALLINT,
        org_olor              SMALLINT,
        org_textura           SMALLINT,
        org_ojos              SMALLINT,
        org_apariencia        SMALLINT,
        org_promedio          NUMERIC(4,2),
        org_clasificacion     VARCHAR(1),
        gramaje_grande        NUMERIC(8,2),
        gramaje_pequeno       NUMERIC(8,2),
        dosis_g_por_lb        NUMERIC(8,3),
        total_metabisulfito   NUMERIC(10,2),
        contaminacion         BOOLEAN     DEFAULT FALSE,
        condicion_transporte  VARCHAR(10),
        observaciones         TEXT,
        acciones_correctivas  TEXT,
        supervisor_cc         VARCHAR(100),
        jefe_cc               VARCHAR(100)
      );
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
    `)
    console.log('✅ Tablas listas\n')

    // Limpiar datos anteriores en orden hijo → padre (respeta FK)
    console.log('🧹 Limpiando datos de calidad anteriores...')
    await client.query('DELETE FROM pescado_romaneo')
    await client.query('DELETE FROM pescado_recepcion')
    await client.query('DELETE FROM camaron_recepcion')
    await client.query('DELETE FROM recepciones_calidad')
    await client.query("SELECT setval('recepciones_calidad_id_seq', 1, false)")

    // Obtener proveedores (creados por seed-cloud.js)
    const { rows: provRows } = await client.query(
      'SELECT id_proveedor FROM proveedores ORDER BY id_proveedor'
    )
    if (provRows.length === 0) {
      throw new Error('Sin proveedores. Ejecuta primero: node db/seed-cloud.js')
    }
    const provIds = provRows.map(r => r.id_proveedor)
    console.log(`✅ ${provIds.length} proveedores encontrados\n`)

    // ── 60 días históricos ─────────────────────────────────────────────────
    console.log('📦 Generando 60 días de histórico...')

    for (let dia = 60; dia >= 1; dia--) {
      const fecha = fechaStr(dia)

      // 2–4 recepciones de camarón por día (85% calidad buena)
      for (let i = 0; i < rand(2, 4); i++) {
        await insertarCamaron(client, {
          fecha,
          hora:     `${String(rand(7, 16)).padStart(2,'0')}:${String(rand(0, 59)).padStart(2,'0')}`,
          provId:   pick(provIds),
          calBuena: Math.random() > 0.15,
        })
      }

      // 1–3 recepciones de pescado por día (90% calidad buena)
      for (let i = 0; i < rand(1, 3); i++) {
        await insertarPescado(client, {
          fecha,
          hora:     `${String(rand(7, 17)).padStart(2,'0')}:${String(rand(0, 59)).padStart(2,'0')}`,
          provId:   pick(provIds),
          calBuena: Math.random() > 0.10,
        })
      }

      // Progreso cada 10 días
      if (dia % 10 === 0 || dia === 1) process.stdout.write(`   ✓ Día -${dia}\n`)
    }

    // ── HOY — recepciones fijas con horarios reales ────────────────────────
    console.log('\n📅 Insertando recepciones de HOY...')
    const hoy = fechaStr(0)

    const recepcionesHoy = [
      // 5 recepciones de camarón (una con problema para generar alerta)
      { tipo: 'camaron', hora: '07:30', prov: 0, calBuena: true  },
      { tipo: 'camaron', hora: '09:15', prov: 1, calBuena: true  },
      { tipo: 'camaron', hora: '11:00', prov: 2, calBuena: false }, // ← alerta
      { tipo: 'camaron', hora: '13:30', prov: 3, calBuena: true  },
      { tipo: 'camaron', hora: '15:45', prov: 0, calBuena: true  },
      // 3 recepciones de pescado
      { tipo: 'pescado', hora: '08:00', prov: 1, calBuena: true  },
      { tipo: 'pescado', hora: '10:30', prov: 2, calBuena: true  },
      { tipo: 'pescado', hora: '14:00', prov: 4 % provIds.length, calBuena: true  },
    ]

    for (const r of recepcionesHoy) {
      const provId = provIds[r.prov % provIds.length]
      if (r.tipo === 'camaron') {
        await insertarCamaron(client, { fecha: hoy, hora: r.hora, provId, calBuena: r.calBuena })
      } else {
        await insertarPescado(client, { fecha: hoy, hora: r.hora, provId, calBuena: r.calBuena })
      }
      console.log(`   ✓ ${r.tipo.padEnd(7)} ${r.hora}  prov#${provId}  calidad:${r.calBuena ? 'ok' : 'ALERTA'}`)
    }

    console.log(`\n✅ Seed completado — ${contador - 1} recepciones generadas`)
    console.log('   Tablas: recepciones_calidad · camaron_recepcion · pescado_recepcion · pescado_romaneo')
    console.log('   Período: 60 días históricos + HOY (5 camarón · 3 pescado)')
    console.log('\n🌐 Abre https://jjseafoods.vercel.app para ver el dashboard con datos reales 🚀')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error(err.stack)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
