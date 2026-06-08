const { body, param, query } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number.'),
];

const projectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required.').isLength({ max: 200 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on_hold', 'completed'])
    .withMessage('Invalid status.'),
];

const taskCreateRules = [
  body('projectId').isInt({ min: 1 }).withMessage('Valid project is required.'),
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 200 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status.'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority.'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date.'),
];

const taskUpdateRules = [
  body('projectId').optional().isInt({ min: 1 }),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
];

const commentRules = [
  body('taskId').isInt({ min: 1 }).withMessage('Valid task is required.'),
  body('body').trim().notEmpty().withMessage('Comment body is required.').isLength({ max: 5000 }),
];

const commentUpdateRules = [
  body('body').trim().notEmpty().withMessage('Comment body is required.').isLength({ max: 5000 }),
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid ID.')];

const uploadRules = [
  body('resourceType')
    .isIn(['user', 'project', 'task'])
    .withMessage('resourceType must be user, project, or task.'),
  body('resourceId').isInt({ min: 1 }).withMessage('Valid resourceId is required.'),
];

const listQueryRules = [
  query('search').optional().trim().isLength({ max: 200 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  projectRules,
  taskCreateRules,
  taskUpdateRules,
  commentRules,
  commentUpdateRules,
  idParam,
  uploadRules,
  listQueryRules,
};
