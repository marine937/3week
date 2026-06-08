const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateWithErrors } = require('../middleware/validate');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require('../validators');

const router = express.Router();

router.post('/register', registerRules, validateWithErrors, authController.register);
router.post('/login', loginRules, validateWithErrors, authController.login);
router.post('/forgot-password', forgotPasswordRules, validateWithErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordRules, validateWithErrors, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
