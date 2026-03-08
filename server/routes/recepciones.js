const express = require('express');
const router = express.Router();
const pool = require('../db');

// Genera numero de recepcion: 005538 formato
async function generarNumeroRecepcion() {
  const result = await pool.query(
    'SELECT COUNT(*) FROM recepciones'
  );
  const count = parseInt(result.rows[0].count) + 1;
  return String(count).padStart(6, '0');
}

// GET todas las recepciones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, p.nombre as proveedor_nombre
      FROM recepciones r
      LEFT JOIN proveedores p ON r.id_proveedor = p.id_proveedor
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener recepciones' });
  }
});

// GET una recepcion con detalle
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const recepcion = await pool.query(`
      SELECT r.*, p.nombre as proveedor_nombre
      FROM recepciones r
      LEFT JOIN proveedores p ON r.id_proveedor = p.id_proveedor
      WHERE r.id_recepcion = $1
    `, [id]);

    const detalle = await pool.query(
      'SELECT * FROM recepcion_detalle WHERE id_recepcion = $1',
      [id]
    );

    const condiciones = await pool.query(
      'SELECT * FROM condiciones_transporte WHERE id_recepcion = $1',
      [id]
    );

    res.json({
      ...recepcion.rows[0],
      detalle: detalle.rows,
      condiciones: condiciones.rows[0] || {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener recepcion' });
  }
});

// POST crear recepcion completa
router.post('/', async (req, res) => {
  const { fecha, hora, id_proveedor, procedencia, observaciones, responsable, productos, condiciones } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const numero = await generarNumeroRecepcion();

    const recepcionResult = await client.query(
      `INSERT INTO recepciones (numero_recepcion, fecha, hora, id_proveedor, procedencia, observaciones, responsable)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [numero, fecha, hora, id_proveedor, procedencia, observaciones, responsable]
    );
    const recepcion = recepcionResult.rows[0];

    for (const prod of productos) {
      const pesos = [
        prod.peso1, prod.peso2, prod.peso3, prod.peso4, prod.peso5,
        prod.peso6, prod.peso7, prod.peso8, prod.peso9, prod.peso10
      ].map(p => parseFloat(p) || 0);

      const pesoTotal = pesos.reduce((sum, p) => sum + p, 0);
      const descuento = parseFloat(prod.descuento_pct) || 2;
      const pesoNeto = pesoTotal * (1 - descuento / 100);

      await client.query(
        `INSERT INTO recepcion_detalle
         (id_recepcion, producto, talla, calidad, peso1, peso2, peso3, peso4, peso5,
          peso6, peso7, peso8, peso9, peso10, peso_total, descuento_pct, peso_neto)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          recepcion.id_recepcion, prod.producto, prod.talla, prod.calidad,
          pesos[0], pesos[1], pesos[2], pesos[3], pesos[4],
          pesos[5], pesos[6], pesos[7], pesos[8], pesos[9],
          pesoTotal, descuento, pesoNeto
        ]
      );
    }

    if (condiciones) {
      await client.query(
        `INSERT INTO condiciones_transporte
         (id_recepcion, transporte_limpio, suficiente_hielo, combustible_cerca, animales_cerca, objetos_cerca)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          recepcion.id_recepcion,
          condiciones.transporte_limpio || false,
          condiciones.suficiente_hielo || false,
          condiciones.combustible_cerca || false,
          condiciones.animales_cerca || false,
          condiciones.objetos_cerca || false
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...recepcion, numero_recepcion: numero });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al guardar recepcion' });
  } finally {
    client.release();
  }
});

module.exports = router;
