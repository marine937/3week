const express = require('express');
const projectsController = require('../controllers/projects.controller');
const { authenticate } = require('../middleware/auth');
const { validateWithErrors } = require('../middleware/validate');
const { projectRules, idParam, listQueryRules } = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', listQueryRules, validateWithErrors, projectsController.listProjects);
router.get('/:id', idParam, validateWithErrors, projectsController.getProject);
router.post('/', projectRules, validateWithErrors, projectsController.createProject);
router.put('/:id', [...idParam, ...projectRules], validateWithErrors, projectsController.updateProject);
router.delete('/:id', idParam, validateWithErrors, projectsController.deleteProject);

module.exports = router;
