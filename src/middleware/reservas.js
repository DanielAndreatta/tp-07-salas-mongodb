// Datos iniciales en memoria
const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {
  const valores = req.body ?? {};

  const estudiante = String(valores.estudiante ?? "").trim();
  const email = String(valores.email ?? "").trim();
  const sala = String(valores.sala ?? "").trim();
  const fecha = String(valores.fecha ?? "").trim();
  const turno = String(valores.turno ?? "").trim();
  const personas = Number(valores.personas);

  const esValido =
    estudiante &&
    email.includes("@") &&
    salasPermitidas.includes(sala) &&
    fecha &&
    turnosPermitidos.includes(turno) &&
    Number.isInteger(personas) &&
    personas >= 1 &&
    personas <= 6;

  if (!esValido) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error:
        "Comprueba que todos los campos sean correctos, la cantidad de personas (1-6) y que el email contenga @.",
      valores: valores,
      salasPermitidas,
      turnosPermitidos,
    });
  }

  req.reservaValidada = { estudiante, email, sala, fecha, turno, personas };
  next();
}

module.exports = { prepararAreaReservas, validarReserva };
