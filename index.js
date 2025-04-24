const express = require("express");
const publicarEnMilanuncios = require("./publicador");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/publicar", async (req, res) => {
  const { titulo, descripcion, precio, imagenUrl } = req.body;

  if (!titulo || !descripcion || !precio || !imagenUrl) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  console.log(`📥 Recibido: ${titulo} - ${precio} €`);

  const exito = await publicarEnMilanuncios({
    titulo,
    descripcion,
    precio,
    imagen: imagenUrl,
  });

  if (exito) {
    res
      .status(200)
      .json({ status: "ok", mensaje: "Producto publicado en Milanuncios" });
  } else {
    res
      .status(500)
      .json({ status: "error", mensaje: "Error al publicar el producto" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`)
);
