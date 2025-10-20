const fs = require('fs');
const PDFDocument = require('pdfkit');
const mammoth = require('mammoth');

async function convertDocxToPdf(inputPath, outputPath) {
  try {
    const { value } = await mammoth.extractRawText({ path: inputPath });

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));
    doc.fontSize(12).text(value);
    doc.end();

    console.log(`✅ Converted: ${inputPath} → ${outputPath}`);
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

module.exports = {
    convertDocxToPdf
}