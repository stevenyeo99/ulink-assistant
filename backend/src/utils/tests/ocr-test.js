const fs = require("fs");
const { PDFParse } = require('pdf-parse');
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const { fromPath: pdfToImages } = require("pdf2pic");
const path = require("path");
const mimeTypes = require('mime-types');
const Poppler = require('pdf-poppler');
const sharp = require('sharp');

async function extractOCRText(filePath) {

  const mimeType = mimeTypes.lookup(filePath);
  
  let text = "";

  if (mimeType === "application/pdf") {

    const pdfBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: pdfBuffer });
    const parserText = await parser.getText();
    
    let combineParserText = '';
    parserText?.pages.forEach(p => {
      combineParserText += p.text + '\r\n\r\n';
    });


    if (combineParserText.trim().length > 0) {
      text = combineParserText;
    } else {
      console.log("No text layer found. Performing OCR on PDF pages...");
      const convert = pdfToImages(filePath, { format: "png", width: 1500 });
      const page1 = await convert(1, { saveFilename: "page1", savePath: path.join(__dirname, 'tmp') });
      const { data: ocr } = await Tesseract.recognize(page1.path, "eng");
      text = ocr.text;
    }
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else if (mimeType.startsWith("image/")) {
    const { data: ocr } = await Tesseract.recognize(filePath, "eng+ind");
    text = ocr.text;
  } else if (mimeType === "text/plain") {
    text = fs.readFileSync(filePath, "utf8");
  } else {
    throw new Error("Unsupported file type for OCR/text extraction");
  }

  console.log(text);
  return text;
}

async function doOcrByPoppler(filePath) {
  const tmpDir = path.join(__dirname, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const safePdf = path.join(tmpDir, 'input.pdf');
  if (filePath !== safePdf) fs.copyFileSync(filePath, safePdf);

  const pdfBuffer = fs.readFileSync(safePdf);
  const parser = new PDFParse({ data: pdfBuffer });
  const info = await parser?.getInfo();
  const pages = info?.total || 1;

  let ocrText = '';
  for (let i = 1; i <= pages; i++) {
    const outPrefix = path.join(tmpDir, 'page');
    const opts = {
      format: 'png',
      out_dir: tmpDir,
      out_prefix: 'page',
      page: i,
      dpi: 400,
      grayscale: true
    };

    try {
      await Poppler.convert(safePdf, opts);
    } catch (err) {
      throw new Error(`pdftoppm/poppler conversion failed: ${err.message || err}`);
    }

    const pagePath = `${outPrefix}-${i}.png`;
    const { data: ocr } = await Tesseract.recognize(pagePath, "eng");
    ocrText += ocr.text;
  }
  
  console.log(ocrText);
  return ocrText;
}

async function renderAllPagesPoppler(pdfPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });

  await Poppler.convert(pdfPath, {
    format: 'png',
    out_dir: outDir,
    out_prefix: 'page',
    dpi: 400,
  });

  return fs.readdirSync(outDir)
    .filter(f => /^page-\d+\.png$/i.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map(f => path.join(outDir, f));
}

async function preprocessImage(inPath, outPath) {
  await sharp(inPath)
    .grayscale()
    .normalise()
    .threshold(210)
    .toFile(outPath)
  
  return outPath;
}

async function ocrImage(imgPath, { whitelist = null, lang = "eng+ind", psm = 6 } = {}) {
  const tessConfig = {
    tessedit_pageseg_mode: String(psm),
    tessedit_ocr_engine_mode: "1",
  };

  if (whitelist) {
    tessConfig.tessedit_char_whitelist = whitelist;
  }

  const { data } = await Tesseract.recognize(imgPath, lang, { tessedit_pageseg_mode: psm, tessedit_ocr_engine_mode: 1, tessedit_char_whitelist: whitelist ?? undefined });
  
  return data.text || "";
}

async function ocrPdf(pdfPath) {
  
  const tmpDir = path.join(__dirname, 'tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  // Copy to ASCII-safe name
  const safePdf = path.join(tmpDir, "input.pdf");
  if (pdfPath !== safePdf) fs.copyFileSync(pdfPath, safePdf);

  const pages = await renderAllPagesPoppler(safePdf, tmpDir);

  let finalText = "";
  for (const page of pages) {
    const pre = page.replace(/\.png$/i, ".pre.png");
    await preprocessImage(page, pre);

    // Try PSM 6; if layout is multi-column, PSM 4 can help
    const pageText = await ocrImage(pre, { lang: "eng+ind", psm: 4 });
    finalText += pageText + "\n";
  }

  // Normalize to clean UTF-8
  const ocrFinalText = Buffer.from(finalText, "utf8").toString("utf8")
    .normalize("NFKC")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, "")
    .trim();

  console.log(ocrFinalText);

  return ocrFinalText;
}

const filePath = path.join(__dirname, 'Ulink x FM Clinic – Sample.pdf');

// extractOCRText(filePath)
ocrPdf(filePath);
