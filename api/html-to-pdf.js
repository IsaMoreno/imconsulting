/**
 * HTMLtoPDF.js
 * IM Consulting — HTML to PDF Converter
 * 
 * Usa Chrome que ya está instalado en Windows
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

class HTMLtoPDF {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      format: options.format || 'A4',
      margin: options.margin || {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: options.printBackground !== false,
      chromeExecutablePath: options.chromeExecutablePath || this._findChrome()
    };
  }

  _findChrome() {
    // Rutas comunes de Chrome en Windows
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.CHROME_PATH
    ];

    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        console.log(`✅ Chrome encontrado en: ${path}`);
        return path;
      }
    }

    throw new Error('Chrome no encontrado. Instala Chrome o establece CHROME_PATH');
  }

  async convertToPDF(htmlContent, pdfOptions = {}) {
    let browser;
    try {
      console.log('🌐 Conectando a Chrome...');
      browser = await puppeteer.launch({
        headless: this.options.headless,
        executablePath: this.options.chromeExecutablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      console.log('📄 Creando página...');
      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      });

      console.log('💉 Inyectando HTML...');
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('📑 Generando PDF...');
      const pdfBuffer = await page.pdf({
        format: pdfOptions.format || this.options.format,
        margin: pdfOptions.margin || this.options.margin,
        printBackground: pdfOptions.printBackground !== false,
        preferCSSPageSize: true
      });

      await page.close();

      console.log(`✅ PDF generado exitosamente (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error al convertir HTML a PDF:', error.message);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async convertToPDFFile(htmlContent, outputPath, pdfOptions = {}) {
    try {
      const pdfBuffer = await this.convertToPDF(htmlContent, pdfOptions);
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, pdfBuffer);
      console.log(`💾 PDF guardado en: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('❌ Error al guardar PDF:', error.message);
      throw error;
    }
  }

  async convertHTMLFileToPDF(htmlFilePath, outputPath, pdfOptions = {}) {
    try {
      const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
      return await this.convertToPDFFile(htmlContent, outputPath, pdfOptions);
    } catch (error) {
      console.error('❌ Error al leer archivo HTML:', error.message);
      throw error;
    }
  }
}

module.exports = HTMLtoPDF;