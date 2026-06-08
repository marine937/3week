const express = require('express');
const tasksController = require('../controllers/tasks.controller');
const { authenticate } = require('../middleware/auth');
const { validateWithErrors } = require('../middleware/validate');
const { taskCreateRules, taskUpdateRules, idParam, listQueryRules } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', listQueryRules, validateWithErrors, tasksController.listTasks);
router.get('/:id', idParam, validateWithErrors, tasksController.getTask);
router.post('/', taskCreateRules, validateWithErrors, tasksController.createTask);
router.put('/:id', [...idParam, ...taskUpdateRules], validateWithErrors, tasksController.updateTask);
router.delete('/:id', idParam, validateWithErrors, tasksController.deleteTask);

module.exports = router;
