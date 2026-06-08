const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { AppError } = require('../utils/errors');

const uploadDir = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || 'uploads'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const maxSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 5;
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed: ${file.mimetype}`, 400));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: maxSizeBytes },
  fileFilter,
});

module.exports = { upload, uploadDir };
