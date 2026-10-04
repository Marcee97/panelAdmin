import { ESTADOS, ETIQUETA, formatearFecha, siguienteEstado } from "./utils";

function DetallePedido({ pedido, onCerrar, onCambiarEstado }) {
  const abierto = !!pedido;

  return (
    <>
      <div className={"fondo" + (abierto ? " on" : "")} onClick={onCerrar} />
      <aside className={"detalle" + (abierto ? " on" : "")}>
        {pedido && (
          <>
            <button className="cerrar" onClick={onCerrar}>×</button>
            <h2>{pedido.cliente}</h2>
            <span className={"badge " + pedido.estado}>
              {ETIQUETA[pedido.estado]}
            </span>
            <span className="muted">
              {" "}· {pedido.origen} · {formatearFecha(pedido.fecha)}
            </span>

            <div className="bloque">
              <h3>Productos</h3>
              {pedido.items.map((i, idx) => (
                <div className="item" key={idx}>
                  <span>{i.n}</span>
                  <span className="muted">×{i.c}</span>
                </div>
              ))}
              <div className="item">
                <span className="muted">Total</span>
                <span>{pedido.total}</span>
              </div>
            </div>

            <div className="bloque">
              <h3>Envío</h3>
              {pedido.direccion}
              <br />
              <span className="muted">{pedido.telefono}</span>
            </div>

            <div className="acciones">
              {ESTADOS.filter((e) => e !== pedido.estado).map((e) => (
                <button
                  key={e}
                  className={
                    "btn" + (e === siguienteEstado(pedido.estado) ? " primario" : "")
                  }
                  onClick={() => onCambiarEstado(pedido.id, e)}
                >
                  Marcar {ETIQUETA[e].toLowerCase()}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default DetallePedido;