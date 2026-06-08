const express = require('express');
const commentsController = require('../controllers/comments.controller');
const { authenticate } = require('../middleware/auth');
const { validateWithErrors } = require('../middleware/validate');
const { commentRules, commentUpdateRules, idParam, listQueryRules } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', listQueryRules, validateWithErrors, commentsController.listComments);
router.get('/:id', idParam, validateWithErrors, commentsController.getComment);
router.post('/', commentRules, validateWithErrors, commentsController.createComment);
router.put('/:id', [...idParam, ...commentUpdateRules], validateWithErrors, commentsController.updateComment);
router.delete('/:id', idParam, validateWithErrors, commentsController.deleteComment);

module.exports = router;
