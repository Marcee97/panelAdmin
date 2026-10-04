import Filtros from "./Filtros";
import TablaPedidos from "./TablaPedidos";
import DetallePedido from "./DetallePedido";
import TablaSuscripciones from "./TablaSuscripciones";
import { ESTADOS } from "./utils";
import "./PanelAdmin.css";
import { useEffect, useState } from "react";
const API = "http://localhost:4000";


export const PanelAdmin = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [error, setError] = useState(null)
  const [abiertoId, setAbiertoId] = useState(null);
  const [vista, setVista] = useState("pedidos");
const [datosSus, setDatosSus] = useState({ suscripciones: [], resumen: [] });

  useEffect(() => {
  const cargarPedidos = async () => {
    try {
      const res = await fetch(`${API}/pedidos`);
      if (!res.ok) throw new Error("Error al cargar pedidos");
      setPedidos(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };
  cargarPedidos();
}, []);
useEffect(() => {
  const cargarSuscripciones = async () => {
    try {
      const res = await fetch(`${API}/suscripciones`);
      if (!res.ok) throw new Error("Error al cargar suscripciones");
      setDatosSus(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };
  cargarSuscripciones();
}, []);

  const visibles = pedidos.filter(
    (p) => filtro === "todos" || p.estado === filtro,
  );

  const conteos = { todos: pedidos.length };
  ESTADOS.forEach((e) => {
    conteos[e] = pedidos.filter((p) => p.estado === e).length;
  });

  const seleccionado = pedidos.find((p) => p.id === abiertoId) || null;

  // Más adelante acá va el PATCH al backend
  const handleCambiarEstado = async (id, estado) => {
  try {
    const res = await fetch(`${API}/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) throw new Error();
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
  } catch {
    alert("No se pudo actualizar el estado");
  }
};

  return (
    <div className="wrap">
      <h1>Pedidos</h1>
      {cargando && <p className="muted">Cargando pedidos...</p>}
{error && <p className="muted">{error}</p>}
    <div className="chips">
  <button
    className={"chip" + (vista === "pedidos" ? " on" : "")}
    onClick={() => setVista("pedidos")}
  >
    Pedidos
  </button>
  <button
    className={"chip" + (vista === "suscripciones" ? " on" : "")}
    onClick={() => setVista("suscripciones")}
  >
    Suscripciones · {datosSus.suscripciones.length}
  </button>
</div>

{vista === "pedidos" ? (
  <>
    <Filtros filtro={filtro} conteos={conteos} onCambiar={setFiltro} />
    <TablaPedidos pedidos={visibles} onAbrir={setAbiertoId} />
  </>
) : (
  <TablaSuscripciones datos={datosSus} />
)}

<DetallePedido
  pedido={seleccionado}
  onCerrar={() => setAbiertoId(null)}
  onCambiarEstado={handleCambiarEstado}
/>
    </div>
  );
};