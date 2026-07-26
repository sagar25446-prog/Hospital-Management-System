const { Router } = require('express');
const hospitalController = require('./hospital.controller.js');

const router = Router();

router.get('/cities', hospitalController.getCities);
router.get('/specialties', hospitalController.getSpecialties);
router.get('/', hospitalController.listHospitals);
router.get('/:id', hospitalController.getHospital);
router.get('/:id/doctors', hospitalController.getHospitalDoctors);

module.exports = router;
