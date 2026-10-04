import { ETIQUETA, formatearFecha } from "./utils";

function TablaPedidos({ pedidos, onAbrir }) {
  return (
    <div className="tabla">
      <div className="fila head">
        <span>Pedido</span>
        <span>Fecha</span>
        <span>Cliente</span>
        <span>Total</span>
        <span>Estado</span>
      </div>

      {pedidos.length === 0 && (
        <div className="vacio">No hay pedidos en este estado</div>
      )}

      {pedidos.map((p) => (
        <div className="fila" key={p.id} onClick={() => onAbrir(p.id)}>
          <span className="c-id origen">{p.origen}</span>
          <span className="c-fecha muted">{formatearFecha(p.fecha)}</span>
          <span className="c-cli">{p.cliente}</span>
          <span className="c-total">{p.total}</span>
          <span className="c-est">
            <span className={"badge " + p.estado}>{ETIQUETA[p.estado]}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default TablaPedidos;