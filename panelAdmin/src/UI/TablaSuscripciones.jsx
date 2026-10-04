import { formatearFecha } from "./utils";

function TablaSuscripciones({ datos }) {
  const { suscripciones, resumen } = datos;

  return (
    <>
      <h3 className="subtitulo">Remeras comprometidas</h3>
      <div className="tabla">
        <div className="fila-sus head">
          <span>Variante</span>
          <span>Stock</span>
          <span>Comprom.</span>
          <span>Disponible</span>
          <span>A 1 pago</span>
          <span>A 2</span>
          <span>A 3</span>
        </div>
        {resumen.length === 0 && <div className="vacio">Sin suscripciones activas</div>}
        {resumen.map((r) => (
          <div className="fila-sus" key={r.variante}>
            <span>{r.variante}</span>
            <span>{r.stock}</span>
            <span>{r.comprometidas}</span>
            <span className={r.disponible < 0 ? "alerta" : ""}>{r.disponible}</span>
            <span>{r.a1}</span>
            <span>{r.a2}</span>
            <span>{r.a3}</span>
          </div>
        ))}
      </div>

      <h3 className="subtitulo">Suscripciones activas</h3>
      <div className="tabla">
        <div className="fila-sus2 head">
          <span>Cliente</span>
          <span>Remera</span>
          <span>Ciclo</span>
          <span>Alta</span>
          <span>Próx. cobro</span>
        </div>
        {suscripciones.map((s) => (
          <div className="fila-sus2" key={s.id}>
            <span>{s.cliente}</span>
            <span className="muted">{s.variante}</span>
            <span>
              {s.envioGenerado ? "Envío generado" : `${s.enCiclo}/3`}
              <span className="muted"> · {s.pagos} pagos</span>
            </span>
            <span className="muted">{formatearFecha(s.alta)}</span>
            <span className="muted">
              {s.proximoCobro ? formatearFecha(s.proximoCobro) : "—"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default TablaSuscripciones;