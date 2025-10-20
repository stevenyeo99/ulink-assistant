const Poppler = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

async function renderAllPagesPoppler(pdfPath, outDir, fileId) {
    fs.mkdirSync(outDir, { recursive: true });

    await Poppler.convert(pdfPath, {
        format: 'png',
        out_dir: outDir,
        out_prefix: `${fileId}_page`,
        dpi: 400
    });

    return fs.readdirSync(outDir)
        .filter(f => new RegExp(`^${fileId}_page-\\d+\\.png$`, 'i').test(f))
        .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
        .map(f => path.join(outDir, f));
}

module.exports = {
    renderAllPagesPoppler
}