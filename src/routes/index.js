const express = require('express');
const router = express.Router();

router.use('/sensors', require('./sensors'));
router.use('/tanks', require('./tanks'));
router.use('/alerts', require('./alerts'));
router.use('/feeding', require('./feeding'));
router.use('/system-health', require('./systemHealth'));
router.use('/users', require('./users'));
router.use('/thresholds', require('./thresholds'));
router.use('/messages', require('./messages'));
router.use('/audit-log', require('./auditLog'));
router.use('/password-resets', require('./passwordResets'));
router.use('/verification-codes', require('./verificationCodes'));
router.use('/esp32', require('./esp32'));

module.exports = router;
