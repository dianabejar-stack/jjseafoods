/**
 * recepcionesCalidad.js
 * Endpoints para guardar recepciones de calidad (camarón y pescado).
 *
 * POST /api/recepciones-calidad/camaron  → guarda recepción de camarón completa
 * POST /api/recepciones-calidad/pescado  → guarda recepción de pescado con romaneo
 * GET  /api/recepciones-calidad          → lista las últimas recepciones guardadas
 */
const express = require('express')
const router  = express.Router()
const pool    = require('../db')

// ─── Función auxiliar: busca id_proveedor por nombre ──────────────────────
async function buscarProveedor(client, nombre) {
  if (!nombre) return null
  const res = await client.query(
    'SELECT id_proveedor FROM proveedores WHERE nombre = $1',
    [nombre]
  )
  return res.rows[0]?.id_proveedor ?? null
}

// ─── Función auxiliar: calcula promedio y clasificación organoléptica ──────
function calcOrganolectica(org) {
  const vals = [org.Color, org.Olor, org.Textura, org.Ojos, org.Apariencia]
  const prom  = vals.reduce((a, b) => a + Number(b), 0) / vals.length
  const clas  = prom >= 2.6 ? 'A' : prom >= 2.0 ? 'B' : prom >= 1.5 ? 'C' : 'R'
  return { promedio: parseFloat(prom.toFixed(2)), clasificacion: clas }
}

// ─── POST /camaron ─────────────────────────────────────────────────────────
router.post('/camaron', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const {
      nroRecepcion, datos, tipo_camaron, estado,
      defectos, calidad, organolectica, condiciones,
      gramaje, dosis, firmas,
    } = req.body

    // 1. Insertar cabecera
    const idProv = await buscarProveedor(client, datos.proveedor)
    const rec = await client.query(
      `INSERT INTO recepciones_calidad (tipo, nro_recepcion, fecha, hora_llegada, id_proveedor)
       VALUES ('camaron', $1, $2, $3, $4) RETURNING id`,
      [nroRecepcion, datos.fecha, datos.horaLlegada, idProv]
    )
    const idRec = rec.rows[0].id

    // 2. Calcular promedio organoléptico
    const { promedio: orgProm, clasificacion: orgClas } = calcOrganolectica(organolectica)

    // 3. Insertar detalle camarón (62 parámetros)
    await client.query(`
      INSERT INTO camaron_recepcion (
        id_recepcion,
        nro_lote, nro_gavetas, nro_piscina, libras_reportadas, libras_recibidas,
        temperatura, hora_analisis, nombre_chofer, nro_guia, nro_placa,
        presentacion, origen, especie,
        peso_muestra, color_camaron, gramos, uniformidad, juveniles_pct,
        so2_ppm, clasificacion_prom, basura_pescados, camaron_leche, total_defectos,
        def_fresco_sano, def_flacidez, def_mudado, def_quebrado, def_picado,
        def_necrosis, def_cabeza_floja, def_cabeza_roja, def_cabeza_anaranjada, def_hepatopancreas,
        def_deforme, def_deshidratado, def_deshid_fuerte, def_melanosis,
        def_rosado_rojo, def_semi_rosado, def_corbata_grande, def_corbata_sucia,
        def_lodo_branquias, def_otros,
        calidad,
        org_color, org_olor, org_textura, org_ojos, org_apariencia,
        org_promedio, org_clasificacion,
        gramaje_grande, gramaje_pequeno, dosis_g_por_lb, total_metabisulfito,
        contaminacion, condicion_transporte,
        observaciones, acciones_correctivas, supervisor_cc, jefe_cc
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,
        $57,$58,$59,$60,$61,$62
      )`,
      [
        idRec,
        datos.nroLote      || null, datos.nroGavetas || null, datos.nroPiscina || null,
        datos.librasReportadas || null, datos.librasRecibidas || null,
        datos.temperaturaRecepcion || null, datos.horaAnalisis || null,
        datos.nombreChofer || null, datos.nroGuia || null, datos.nroPlaca || null,
        tipo_camaron.presentacion, tipo_camaron.origen, tipo_camaron.especie,
        estado.pesoMuestra || null, estado.colorCamaron || null,
        estado.gramos || null, estado.uniformidad || null, estado.juveniles || null,
        estado.so2ppm || null, estado.clasificacionPromedio || null,
        estado.basuraPescados || null, estado.camaronLeche || null, estado.totalDefectos || null,
        // defectos condición
        defectos['Fresco y sano']          || 0,
        defectos['Flacidez']               || 0,
        defectos['Mudado']                 || 0,
        defectos['Quebrado / Maltratado']  || 0,
        defectos['Picado']                 || 0,
        defectos['Con necrosis']           || 0,
        defectos['Cabeza floja']           || 0,
        defectos['Cabeza roja']            || 0,
        defectos['Cabeza anaranjada']      || 0,
        defectos['Hepatopancreas reventado'] || 0,
        // defectos adicionales
        defectos['Deforme']                || 0,
        defectos['Deshidratado']           || 0,
        defectos['Deshidratado fuerte']    || 0,
        defectos['Con melanosis']          || 0,
        defectos['Rosado / Rojo']          || 0,
        defectos['Semi Rosado']            || 0,
        defectos['Corbata Grande']         || 0,
        defectos['Corbata Sucia']          || 0,
        defectos['Lodo en branquias']      || 0,
        defectos['Otros']                  || 0,
        // calidad y organoléptica
        calidad,
        organolectica.Color, organolectica.Olor, organolectica.Textura,
        organolectica.Ojos, organolectica.Apariencia,
        orgProm, orgClas,
        // gramaje y dosificación
        gramaje.grande  || null, gramaje.pequeno || null,
        dosis.grPorLb   || null, dosis.totalGramos || null,
        // condiciones
        condiciones.contaminacion === 'SI',
        condiciones.condicionTransporte,
        // observaciones
        firmas.observaciones        || null,
        firmas.accionesCorrectivas  || null,
        firmas.supervisorCC         || null,
        firmas.jefeCC               || null,
      ]
    )

    await client.query('COMMIT')
    res.status(201).json({ ok: true, id: idRec, nroRecepcion })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error guardando camarón:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  } finally {
    client.release()
  }
})

// ─── POST /pescado ─────────────────────────────────────────────────────────
router.post('/pescado', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { nroRecepcion, datos, presentacion, romaneoFilas, firmas } = req.body

    // 1. Cabecera
    const idProv = await buscarProveedor(client, datos.proveedor)
    const rec = await client.query(
      `INSERT INTO recepciones_calidad (tipo, nro_recepcion, fecha, hora_llegada, id_proveedor)
       VALUES ('pescado', $1, $2, $3, $4) RETURNING id`,
      [nroRecepcion, datos.fecha, datos.hora, idProv]
    )
    const idRec = rec.rows[0].id

    // 2. Header pescado
    await client.query(
      `INSERT INTO pescado_recepcion
         (id_recepcion, nro_lote, presentacion, romaneo_numero,
          observaciones, acciones_correctivas, elaborado_por, revisado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        idRec,
        datos.nroLote         || null,
        presentacion,
        datos.romaneoNumero   || null,
        firmas.observaciones        || null,
        firmas.accionesCorrectivas  || null,
        firmas.elaboradoPor         || null,
        firmas.revisadoPor          || null,
      ]
    )

    // 3. Insertar cada fila del romaneo
    for (const fila of romaneoFilas) {
      // Calcular calificación y clasificación por pieza
      const scores = [fila.color, fila.olor, fila.textura, fila.ojos, fila.branquias]
      const cal    = scores.reduce((a, b) => a + Number(b), 0) / scores.length
      const clas   = cal >= 2.6 ? 'A' : cal >= 2.0 ? 'B' : cal >= 1.5 ? 'C' : 'R'

      const idProvFila = await buscarProveedor(client, fila.proveedor)

      await client.query(`
        INSERT INTO pescado_romaneo (
          id_recepcion, hora, codigo, id_proveedor, especie, presentacion,
          peso_lb, nro_piezas, presencia_hielo, temperatura, objetos_extranos,
          org_color, org_olor, org_textura, org_ojos, org_branquias,
          calificacion, clasificacion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          idRec,
          fila.hora        || null,
          fila.codigo      || null,
          idProvFila,
          fila.especie,
          fila.presentacion,
          fila.peso        || null,
          fila.nroPiezas   || 1,
          fila.presenciaHielo,
          fila.temperatura || null,
          fila.objExtranos,
          fila.color, fila.olor, fila.textura, fila.ojos, fila.branquias,
          parseFloat(cal.toFixed(2)),
          clas,
        ]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ ok: true, id: idRec, nroRecepcion })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error guardando pescado:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  } finally {
    client.release()
  }
})

// ─── GET / — Lista recepciones de calidad (últimas 100) ───────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rc.id, rc.tipo, rc.nro_recepcion, rc.fecha,
             rc.hora_llegada, p.nombre AS proveedor, rc.created_at
      FROM   recepciones_calidad rc
      LEFT   JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      ORDER  BY rc.created_at DESC
      LIMIT  100
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
