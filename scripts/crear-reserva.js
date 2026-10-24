const {
  conectarBaseDatos,
  desconectarBaseDatos,
} = require("../src/config/base-datos");
const Reserva = require("../src/modelos/reserva");

async function main() {
  try {
    await conectarBaseDatos();
    const reserva = await Reserva.create({
      estudiante: "Daniel Andreatta",
      email: "daniel@ejemplo.com",
      sala: "Sala Norte",
      fecha: "2026-10-25",
      turno: "Mañana",
      personas: 2,
    });
    console.log("Reserva guardada. _id:", reserva._id.toString());
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch((error) => {
  console.error("No se pudo crear la reserva:", error.name);
  if (error.errors) {
    console.error("Campos a revisar:", Object.keys(error.errors).join(", "));
  } else {
    console.error("Revisar datos, configuración y disponibilidad de MongoDB.");
  }
  process.exitCode = 1;
});
