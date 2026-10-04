import { ESTADOS, ETIQUETA } from "./utils";

function Filtros({ filtro, conteos, onCambiar }) {
  const opciones = ["todos", ...ESTADOS];

  return (
    <div className="chips">
      {opciones.map((o) => (
        <button
          key={o}
          className={"chip" + (o === filtro ? " on" : "")}
          onClick={() => onCambiar(o)}
        >
          {o === "todos" ? "Todos" : ETIQUETA[o]} · {conteos[o]}
        </button>
      ))}
    </div>
  );
}

export default Filtros;