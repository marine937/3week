const express = require('express');
const filesController = require('../controllers/files.controller');
const { authenticate } = require('../middleware/auth');
const { validateWithErrors } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { uploadRules, idParam } = require('../validators');

const router = express.Router();

router.get('/:filename', filesController.serveFile);

router.use(authenticate);

router.post(
  '/',
  upload.single('file'),
  uploadRules,
  validateWithErrors,
  filesController.uploadFile
);
router.get('/', filesController.listFiles);
router.delete('/:id', idParam, validateWithErrors, filesController.deleteFile);

module.exports = router;
