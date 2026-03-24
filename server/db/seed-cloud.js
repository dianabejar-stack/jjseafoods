/**
 * seed-cloud.js
 * Pobla la base de datos de Render (cloud) con datos de demostración.
 * Ejecutar desde la carpeta server/:
 *   node db/seed-cloud.js
 */

const { Pool } = require('pg');

const DATABASE_URL =
  'postgresql://jjseafoods_db_user:BTJq5u04yStKFZ5nJfKUYZIH8oiuthqg@dpg-d6mvr6s50q8c73as0avg-a.oregon-postgres.render.com/jjseafoods_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ─── Catálogos ────────────────────────────────────────────────────────────────

const proveedores = [
  { nombre: 'Bryan Intriago',  ruc: '0801234567001', telefono: '0991234567', direccion: 'Esmeraldas' },
  { nombre: 'Scarleth Copete', ruc: '0809876543001', telefono: '0997654321', direccion: 'Esmeraldas' },
  { nombre: 'Joao Cevillano',  ruc: '0805555555001', telefono: '0993333333', direccion: 'Muisne'     },
  { nombre: 'Antonio Maurini', ruc: '0800863243001', telefono: '0801193483', direccion: 'Lagarto'    },
  { nombre: 'Don Pablo Fleet', ruc: '0891751842001', telefono: '0999876543', direccion: 'Atacames'   },
  { nombre: 'Dilan Cevillano', ruc: '0807788990001', telefono: '0994455667', direccion: 'Muisne'     },
  { nombre: 'Joffre Copete',   ruc: '0891751842002', telefono: '0992012968', direccion: 'Esmeraldas' },
];

const especies = [
  { producto: 'Tuna YF',    tallas: ['60-99','100+','50-60'],  calidades: ['1+','A'],  pesoMin: 56,  pesoMax: 185, peso: 0.45 },
  { producto: 'Dorado',     tallas: ['12-16','17+','20+'],     calidades: ['A','B'],   pesoMin: 12,  pesoMax: 198, peso: 0.25 },
  { producto: 'Mahi Mahi',  tallas: ['15+','20+'],             calidades: ['A','1+'],  pesoMin: 46,  pesoMax: 185, peso: 0.15 },
  { producto: 'Pargo Silk', tallas: ['1-2','2-3','4-6'],       calidades: ['A','B'],   pesoMin: 80,  pesoMax: 163, peso: 0.08 },
  { producto: 'Wahoo',      tallas: ['20+','30+'],             calidades: ['A'],       pesoMin: 24,  pesoMax: 120, peso: 0.05 },
  { producto: 'Espada',     tallas: ['35-49','70-99','100+'],  calidades: ['A','B'],   pesoMin: 34,  pesoMax: 150, peso: 0.02 },
];

const responsables = ['Gissella Reyes', 'Paula Copete', 'Gabriela Mera', 'Ismael Mina'];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function rand(min, max)      { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function randItem(arr)       { return arr[Math.floor(Math.random() * arr.length)]; }

function randEspecie() {
  const r = Math.random();
  let acum = 0;
  for (const e of especies) { acum += e.peso; if (r <= acum) return e; }
  return especies[0];
}

function padNum(n) { return String(n).padStart(6, '0'); }

function fechaStr(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
}

// ─── Insertar una recepción completa ─────────────────────────────────────────

async function insertarRecepcion(client, { fecha, hora, provId, procedencia, responsable, numProductos, recCounter, alertaForzada }) {
  const numeroRec = padNum(recCounter);

  const recResult = await client.query(
    `INSERT INTO recepciones (numero_recepcion, fecha, hora, id_proveedor, procedencia, observaciones, responsable)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_recepcion`,
    [numeroRec, fecha, hora, provId, procedencia, '', responsable]
  );
  const recId = recResult.rows[0].id_recepcion;

  for (let p = 0; p < numProductos; p++) {
    const esp     = randEspecie();
    const talla   = randItem(esp.tallas);
    const calidad = randItem(esp.calidades);
    const numP    = rand(1, 8);
    const pesos   = Array.from({ length: 10 }, (_, i) => i < numP ? rand(esp.pesoMin, esp.pesoMax) : null);
    const pesoTotal = pesos.reduce((s, v) => s + (v || 0), 0);
    const descuento = randFloat(1.5, 3.0);
    const pesoNeto  = parseFloat((pesoTotal * (1 - descuento / 100)).toFixed(2));

    await client.query(
      `INSERT INTO recepcion_detalle
       (id_recepcion, producto, talla, calidad,
        peso1,peso2,peso3,peso4,peso5,peso6,peso7,peso8,peso9,peso10,
        peso_total, descuento_pct, peso_neto)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [recId, esp.producto, talla, calidad, ...pesos, pesoTotal, descuento, pesoNeto]
    );
  }

  const forzarProblema = alertaForzada && Math.random() > 0.5;
  await client.query(
    `INSERT INTO condiciones_transporte
     (id_recepcion, transporte_limpio, suficiente_hielo, combustible_cerca, animales_cerca, objetos_cerca)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [recId,
     forzarProblema ? false : Math.random() > 0.08,
     forzarProblema ? false : Math.random() > 0.10,
     forzarProblema ? true  : Math.random() > 0.90,
     Math.random() > 0.93,
     Math.random() > 0.91]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Conectando a la base de datos de Render...');
  const client = await pool.connect();

  try {
    // Limpiar datos anteriores
    console.log('🧹 Limpiando datos anteriores...');
    await client.query('DELETE FROM condiciones_transporte');
    await client.query('DELETE FROM recepcion_detalle');
    await client.query('DELETE FROM recepciones');
    await client.query('DELETE FROM proveedores');
    await client.query("SELECT setval('proveedores_id_proveedor_seq', 1, false)");
    await client.query("SELECT setval('recepciones_id_recepcion_seq', 1, false)");

    // Insertar proveedores
    console.log('👤 Insertando proveedores...');
    const provIds = [];
    for (const p of proveedores) {
      const r = await client.query(
        'INSERT INTO proveedores (nombre, ruc, telefono, direccion) VALUES ($1,$2,$3,$4) RETURNING id_proveedor',
        [p.nombre, p.ruc, p.telefono, p.direccion]
      );
      provIds.push({ id: r.rows[0].id_proveedor, direccion: p.direccion });
    }

    let recCounter = 1;

    // 60 días históricos (4-8 recepciones/día)
    console.log('📦 Insertando recepciones de los últimos 60 días...');
    for (let diasAtras = 60; diasAtras >= 1; diasAtras--) {
      const fecha   = fechaStr(diasAtras);
      const numRec  = rand(4, 8);
      process.stdout.write(`\r   Día -${diasAtras}  (${recCounter} recepciones)`);

      for (let r = 0; r < numRec; r++) {
        const hora        = `${String(rand(7,17)).padStart(2,'0')}:${String(rand(0,59)).padStart(2,'0')}`;
        const prov        = randItem(provIds);
        const responsable = randItem(responsables);

        await insertarRecepcion(client, {
          fecha,
          hora,
          provId:       prov.id,
          procedencia:  prov.direccion,
          responsable,
          numProductos: rand(2, 5),
          recCounter:   recCounter++,
          alertaForzada: false,
        });
      }
    }
    console.log();

    // HOY: 12 recepciones fijas con datos ricos
    console.log('📅 Insertando recepciones de HOY...');
    const hoy = fechaStr(0);
    const horasHoy = ['07:30','08:15','09:00','09:45','10:30','11:00','12:15','13:00','13:45','14:30','15:00','15:45'];

    for (let i = 0; i < horasHoy.length; i++) {
      const prov        = provIds[i % provIds.length];
      const responsable = randItem(responsables);

      await insertarRecepcion(client, {
        fecha:        hoy,
        hora:         horasHoy[i],
        provId:       prov.id,
        procedencia:  prov.direccion,
        responsable,
        numProductos: rand(2, 4),
        recCounter:   recCounter++,
        alertaForzada: i < 3,
      });
    }

    console.log('\n✅ Seed completado exitosamente.');
    console.log(`   Total recepciones: ${recCounter - 1}`);
    console.log(`   Días cubiertos:    60 históricos + hoy`);
    console.log(`   Proveedores:       ${proveedores.length}`);
    console.log('\n🌐 Abre https://jjseafoods.vercel.app para ver el dashboard con datos reales 🚀');

  } catch (err) {
    console.error('\n❌ Error en seed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
