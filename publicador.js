require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");
const puppeteer = require("puppeteer");

function descargarImagen(url, destino) {
  return new Promise((resolve, reject) => {
    console.log("📥 Descargando imagen desde:", url);
    const file = fs.createWriteStream(destino);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            console.log("✅ Imagen descargada en:", destino);
            resolve(destino);
          });
        });
      })
      .on("error", (err) => {
        console.error("❌ Error al descargar la imagen:", err);
        fs.unlink(destino, () => reject(err));
      });
  });
}

async function publicarEnMilanuncios({ titulo, descripcion, precio, imagen }) {
  console.log("🧠 Datos recibidos:", { titulo, descripcion, precio, imagen });

  const nombreArchivo = `imagen-${Date.now()}.jpg`;
  const rutaImagenLocal = path.join(__dirname, nombreArchivo);

  try {
    await descargarImagen(imagen, rutaImagenLocal);

    console.log("🚀 Lanzando navegador...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    console.log("🌍 Abriendo Milanuncios...");
    await page.goto("https://www.milanuncios.com/");
    const [botonLogin] = await page.$x(
      "//button[.//span[text()='Iniciar sesión']]"
    );
    if (botonLogin) {
      await botonLogin.click();
      await page.waitForSelector('input[name="email"]');
    } else {
      throw new Error("No se encontró el botón de 'Iniciar sesión'");
    }
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.MILANUNCIOS_EMAIL);
    await page.type('input[name="password"]', process.env.MILANUNCIOS_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    console.log("📄 Accediendo al formulario de publicación...");
    await page.goto("https://www.milanuncios.com/publicar-anuncios-gratis");

    await page.waitForSelector('input[name="title"]');
    await page.type('input[name="title"]', titulo);
    await page.type('textarea[name="description"]', descripcion);
    await page.type('input[name="price"]', precio.toString());

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('input[type="file"]'),
    ]);
    await fileChooser.accept([rutaImagenLocal]);

    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    console.log("✅ Producto publicado con éxito en Milanuncios.");
    await browser.close();
    fs.unlinkSync(rutaImagenLocal);
    return true;
  } catch (err) {
    console.error("❌ Error al publicar:", err);
    try {
      fs.unlinkSync(rutaImagenLocal);
    } catch (e) {
      console.warn("⚠️ No se pudo borrar imagen local:", e);
    }
    return false;
  }
}

module.exports = publicarEnMilanuncios;
