const { ocrSpace } = require('ocr-space-api-wrapper');
const path = require('path');

const { OCR_API_KEY } = require('../../config');

async function doTriggerOcr(filePath) {
    try {
        const response = await ocrSpace(filePath, {
            apiKey: OCR_API_KEY
        });

        const parsedResults = response?.ParsedResults;
        let parsedText = '';
        parsedResults.forEach(p => {
            parsedText += '\r\n\r\n' + p?.ParsedText;
        });
        parsedText = parsedText.trim();

        return parsedText;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    doTriggerOcr
}