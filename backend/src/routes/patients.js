const express = require('express');
const router = express.Router();
const { getPatients, getStats, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/', getPatients);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
