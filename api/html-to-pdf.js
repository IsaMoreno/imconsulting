/**
 * HTMLtoPDF.js
 * IM Consulting — HTML to PDF Converter
 *
 * Usa @sparticuz/chromium para entornos serverless (Netlify Functions)
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const path = require('path');
const fs = require('fs');

class HTMLtoPDF {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000,
      format: options.format || 'A4',
      margin: options.margin || {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      printBackground: options.printBackground !== false
    };
  }

  async convertToPDF(htmlContent, pdfOptions = {}) {
    let browser;
    try {
      console.log('🌐 Iniciando Chromium serverless...');
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      });

      console.log('📄 Creando página...');
      const page = await browser.newPage();

      await page.setViewport({
        width: 816,
        height: 1056,
        deviceScaleFactor: 2
      });

      console.log('💉 Inyectando HTML...');
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('📑 Generando PDF...');
      const pdfBuffer = await page.pdf({
        format: pdfOptions.format || 'Letter',
        margin: pdfOptions.margin || { top: '0', right: '0', bottom: '0', left: '0' },
        printBackground: pdfOptions.printBackground !== false,
        preferCSSPageSize: false
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