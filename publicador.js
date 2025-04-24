require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer");

/**
 * Descarga una imagen desde una URL y la guarda localmente
 */
function descargarImagen(url, destino) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destino);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(destino));
        });
      })
      .on("error", (err) => {
        fs.unlink(destino, () => reject(err));
      });
  });
}

/**
 * Publica un producto en Milanuncios usando Puppeteer
 */
async function publicarEnMilanuncios({
  titulo,
  descripcion,
  precio,
  imagen,
  categoria = "Informática",
}) {
  const nombreArchivo = `imagen-${Date.now()}.jpg`;
  const rutaImagenLocal = path.join(__dirname, nombreArchivo);

  try {
    // Descargar imagen a local
    await descargarImagen(imagen, rutaImagenLocal);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Ir a Milanuncios y hacer login
    await page.goto("https://www.milanuncios.com/");
    await page.click('a[href*="login"]');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.MILANUNCIOS_EMAIL);
    await page.type('input[name="password"]', process.env.MILANUNCIOS_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Ir al formulario de publicación
    await page.goto("https://www.milanuncios.com/publicar-anuncios-gratis");

    // Esperar y seleccionar categoría (aquí elegimos por defecto informática)
    switch (categoria.toLowerCase()) {
      case "informática":
        await page.waitForSelector('a[href*="informatica"]');
        await page.click('a[href*="informatica"]');
        break;
      case "motor":
        await page.waitForSelector('a[href*="motor"]');
        await page.click('a[href*="motor"]');
        break;
      // Agrega más categorías según necesites
      default:
        console.log(
          "⚠️ Categoría no reconocida. Usando Informática por defecto."
        );
        await page.waitForSelector('a[href*="informatica"]');
        await page.click('a[href*="informatica"]');
        break;
    }

    // Aquí deberías esperar el paso 2 y rellenar el formulario según el flujo de Milanuncios
    await page.waitForSelector('input[name="title"]');
    await page.type('input[name="title"]', titulo);
    await page.type('textarea[name="description"]', descripcion);
    await page.type('input[name="price"]', precio.toString());

    // Subir imagen
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('input[type="file"]'),
    ]);
    await fileChooser.accept([rutaImagenLocal]);

    // Publicar anuncio
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    console.log("✅ Producto publicado en Milanuncios");
    await browser.close();
    fs.unlinkSync(rutaImagenLocal);
    return true;
  } catch (err) {
    console.error("❌ Error al publicar:", err);
    try {
      fs.unlinkSync(rutaImagenLocal);
    } catch {}
    return false;
  }
}

module.exports = publicarEnMilanuncios;
