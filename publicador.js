require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer");

function descargarImagen(url, destino) {
  return new Promise((resolve, reject) => {
    console.log("🌐 Descargando imagen:", url);
    const file = fs.createWriteStream(destino);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          console.log("✅ Imagen descargada");
          file.close(() => resolve(destino));
        });
      })
      .on("error", (err) => {
        console.error("❌ Error al descargar imagen:", err);
        fs.unlink(destino, () => reject(err));
      });
  });
}

async function publicarEnMilanuncios({ titulo, descripcion, precio, imagen }) {
  const nombreArchivo = `imagen-${Date.now()}.jpg`;
  const rutaImagenLocal = path.join(__dirname, nombreArchivo);

  try {
    console.log("📦 Empezando proceso de publicación...");

    await descargarImagen(imagen, rutaImagenLocal);

    console.log("🚀 Lanzando navegador Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    console.log("🌍 Navegando a Milanuncios...");
    await page.goto("https://www.milanuncios.com/");

    console.log("🔐 Iniciando login...");
    await page.click('a[href*="login"]');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.MILANUNCIOS_EMAIL);
    await page.type('input[name="password"]', process.env.MILANUNCIOS_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log("✅ Login correcto");

    console.log("📤 Navegando a publicación...");
    await page.goto("https://www.milanuncios.com/publicar-anuncios-gratis");

    console.log("🖱️ Haciendo clic en categoría Informática...");
    await page.waitForSelector('a[href*="informatica"]');
    await page.click('a[href*="informatica"]');

    // Puedes continuar desde aquí cuando sepas cómo es el paso 2 exacto

    console.log("🛑 Stop: Llegamos hasta la categoría (paso 1 completado)");

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
