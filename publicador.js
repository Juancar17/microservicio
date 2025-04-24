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
 * Publica un producto en Milanuncios (solo categoría "Informática" para test)
 */
async function publicarEnMilanuncios({ titulo, descripcion, precio, imagen }) {
  const nombreArchivo = `imagen-${Date.now()}.jpg`;
  const rutaImagenLocal = path.join(__dirname, nombreArchivo);

  try {
    await descargarImagen(imagen, rutaImagenLocal);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Login
    await page.goto("https://www.milanuncios.com/");
    await page.click('a[href*="login"]');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.MILANUNCIOS_EMAIL);
    await page.type('input[name="password"]', process.env.MILANUNCIOS_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Ir a publicar
    await page.goto("https://www.milanuncios.com/publicar-anuncios-gratis");
    await page.waitForSelector('a[href*="informatica"]');
    await page.click('a[href*="informatica"]');

    // Aquí continuarás con paso 2 cuando veas qué campos hay tras elegir categoría

    console.log("✅ Categoría seleccionada y listo para continuar");
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
