const multer = require('multer');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

const { UPLOAD_PATH, UPLOAD_END } = require('../config');

// file type allowed to be upload
const allowedMimes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const UPLOAD_DIR = path.join(__dirname, '..', '..', UPLOAD_PATH, UPLOAD_END);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        console.log(file);
        const ts = moment().format('YYYYMMDDHHmmss');
        const ext = path.extname(file.originalname);
        const safePdf = `${ts}_input${ext}`;
        cb(null, safePdf);
    }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log(file);
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", `Unsupported file type: ${file.mimetype}`));
    }
  }
});

module.exports = {
    upload,
};