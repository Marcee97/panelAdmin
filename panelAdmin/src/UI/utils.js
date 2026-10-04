export const ESTADOS = ["pendiente", "armado", "enviado"];

export const ETIQUETA = {
  pendiente: "Para armar",
  armado: "Armado",
  enviado: "Enviado",
};

export const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

export const siguienteEstado = (estado) =>
  ESTADOS[Math.min(ESTADOS.indexOf(estado) + 1, ESTADOS.length - 1)];