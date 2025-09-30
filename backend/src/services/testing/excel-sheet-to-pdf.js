const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const puppeteer = require('puppeteer');
const OpenAI = require('openai');

const INPUT_XLSX = path.join(__dirname, 'Ulink Assist Dr Panel - SG - v2025.08.xlsx');
const SHEET_NAME =  'Doctors';
const OUT_PDF    = path.join(__dirname, 'Doctors.pdf');

// 1) Build HTML from one sheet
function sheetToHTML(xlsxPath, sheetName) {
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found in ${xlsxPath}`);
  const table = XLSX.utils.sheet_to_html(ws, { id: 'sheet' });

  // Add minimal print CSS (landscape, compact table)
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: system-ui, Arial, sans-serif; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; table-layout: auto; }
  th, td { border: 1px solid #ddd; padding: 4px 6px; vertical-align: top; }
  thead th { position: sticky; top: 0; background: #f6f6f6; }
  /* Optional: zebra rows */
  tbody tr:nth-child(odd) td { background: #fafafa; }
</style>
</head>
<body>
<h2 style="margin:0 0 8px 0;">${path.basename(xlsxPath)} — Sheet: ${sheetName}</h2>
${table}
</body>
</html>`;
}

async function sheetToPDF(xlsxPath, sheetName, outPdf) {
  const html = sheetToHTML(xlsxPath, sheetName);
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: outPdf,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '8mm', bottom: '8mm', left: '6mm', right: '6mm' }
  });
  await browser.close();
  console.log('PDF written:', path.resolve(outPdf));
}

sheetToPDF(INPUT_XLSX, SHEET_NAME, OUT_PDF);
