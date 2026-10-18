function crearServicioReservas(reservasIniciales) {
  const reservas = [...reservasIniciales];

  function listar() {
    return [...reservas];
  }

  function contar() {
    return reservas.length;
  }

  function obtenerPorId(id) {
    return reservas.find((reserva) => reserva.id === id) ?? null;
  }

  function crear(datosValidados) {
    const ultimoId = reservas.reduce((maxId, r) => Math.max(maxId, r.id), 0);
    const nuevaReserva = { id: ultimoId + 1, ...datosValidados };
    reservas.push(nuevaReserva);
    return nuevaReserva;
  }

  return { listar, contar, obtenerPorId, crear };
}

module.exports = { crearServicioReservas };
