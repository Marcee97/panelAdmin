require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool } = require("./db");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
const normalizarEstadoVenta = (estado) =>
  estado === "aprobado" ? "pendiente" : estado;

app.get("/pedidos", async (req, res) => {
  try {
    // 1. Ventas
    const { rows } = await pool.query(`
      SELECT v.id, v.fecha, v.nombre, v.total, v.estado, v.telefono,
             v.calle, v.numero, v.ciudad, v.provincia, v.codigo_postal,
             COALESCE(
               json_agg(
                 json_build_object(
                   'n', p.nombre || ' · ' || COALESCE(c.nombre, '?') || ' · ' || vi.talle,
                   'c', vi.cantidad
                 )
               ) FILTER (WHERE vi.id IS NOT NULL),
               '[]'
             ) AS items
      FROM ventas v
      LEFT JOIN venta_items vi ON vi.venta_id = v.id
      LEFT JOIN productos p ON p.id = vi.producto_id
      LEFT JOIN colores c ON c.id = vi.color_id
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `);

    const pedidos = rows.map((v) => ({
      id: `venta-${v.id}`,
      origen: "Compra",
      fecha: v.fecha,
      cliente: v.nombre,
      total: "$" + Number(v.total).toLocaleString("es-AR"),
      estado: normalizarEstadoVenta(v.estado),
      telefono: v.telefono,
      direccion: `${v.calle} ${v.numero}, ${v.ciudad}, ${v.provincia} (${v.codigo_postal})`,
      items: v.items,
    }));

    // 2. Envíos de suscripción
    const { rows: envios } = await pool.query(`
      SELECT e.id, e.created_at AS fecha, e.estado,
             s.nombre, s.telefono, s.calle, s.numero, s.ciudad,
             s.provincia, s.codigo_postal, s.talle,
             p.nombre AS producto, c.nombre AS color
      FROM envios_suscripcion e
      JOIN suscripciones s ON s.id = e.suscripcion_id
      LEFT JOIN productos p ON p.id = s.producto_id
      LEFT JOIN colores c ON c.id::text = s.color_id
    `);

    const enviosPedidos = envios.map((e) => ({
      id: `envio-${e.id}`,
      origen: "Suscripción",
      fecha: e.fecha,
      cliente: e.nombre,
      total: "Suscripción",
      estado: e.estado,
      telefono: e.telefono,
      direccion: `${e.calle} ${e.numero}, ${e.ciudad}, ${e.provincia} (${e.codigo_postal})`,
      items: [{ n: `${e.producto} · ${e.color ?? "?"} · ${e.talle}`, c: 1 }],
    }));

    // 3. Unir y ordenar por fecha
    const todos = [...pedidos, ...enviosPedidos].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );

    res.json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});
const ESTADOS_VALIDOS = ["pendiente", "armado", "enviado"];

app.patch("/pedidos/:id/estado", async (req, res) => {
  const { estado } = req.body;
  const [tipo, idTexto] = req.params.id.split("-");
  const id = Number(idTexto);

  if (!ESTADOS_VALIDOS.includes(estado) || !Number.isInteger(id)) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  try {
    let resultado;

    if (tipo === "venta") {
      const estadoDb = estado === "pendiente" ? "aprobado" : estado;
      resultado = await pool.query(
        "UPDATE ventas SET estado = $1 WHERE id = $2",
        [estadoDb, id],
      );
    } else if (tipo === "envio") {
      resultado = await pool.query(
        "UPDATE envios_suscripcion SET estado = $1 WHERE id = $2",
        [estado, id],
      );
    } else {
      return res.status(400).json({ error: "Tipo de pedido desconocido" });
    }

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el estado" });
  }
});
app.get("/suscripciones", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.nombre, s.talle, s.producto_id, s.color_id,
             s.pagos_realizados, s.created_at,
             p.nombre AS producto, c.nombre AS color, v.stock,
             (SELECT MAX(ps.fecha) FROM pagos_suscripcion ps
               WHERE ps.suscripcion_id = s.id) AS ultimo_pago
      FROM suscripciones s
      LEFT JOIN productos p ON p.id = s.producto_id
      LEFT JOIN colores c ON c.id::text = s.color_id
      LEFT JOIN variantes v ON v.producto_id = s.producto_id
                           AND v.color_id::text = s.color_id
                           AND v.talle = s.talle
      WHERE s.estado = 'activo'
      ORDER BY s.created_at DESC
    `);

    const mapa = {};
    const suscripciones = rows.map((s) => {
      const enCiclo = s.pagos_realizados % 3;
      const faltan = 3 - enCiclo;
      const variante = `${s.producto} · ${s.color ?? "?"} · ${s.talle}`;

      let proximoCobro = null;
      if (s.ultimo_pago) {
        const d = new Date(s.ultimo_pago);
        d.setMonth(d.getMonth() + 1);
        proximoCobro = d;
      }

      // Resumen por variante: cada suscripción activa compromete 1 remera
      const clave = `${s.producto_id}-${s.color_id}-${s.talle}`;
      if (!mapa[clave]) {
        mapa[clave] = { variante, stock: s.stock ?? 0, comprometidas: 0, a1: 0, a2: 0, a3: 0 };
      }
      mapa[clave].comprometidas++;
      mapa[clave][`a${faltan}`]++;

      return {
        id: `SUB-${s.id}`,
        cliente: s.nombre,
        variante,
        pagos: s.pagos_realizados,
        enCiclo,
        faltan,
        envioGenerado: s.pagos_realizados > 0 && enCiclo === 0,
        alta: s.created_at,
        proximoCobro,
      };
    });

    const resumen = Object.values(mapa)
      .map((r) => ({ ...r, disponible: r.stock - r.comprometidas }))
      .sort((a, b) => a.disponible - b.disponible);

    res.json({ suscripciones, resumen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener suscripciones" });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, "127.0.0.1", () =>
  console.log(`Backend en http://localhost:${PORT}`),
);