const sharp = require('sharp');

async function preprocessImage(inPath, outPath) {
  await sharp(inPath)
    .grayscale()
    .normalise()
    .threshold(210)
    .toFile(outPath)
  
  return outPath;
}

module.exports = {
    preprocessImage
}