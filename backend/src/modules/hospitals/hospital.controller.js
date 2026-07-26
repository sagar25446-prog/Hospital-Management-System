const hospitalService = require('./hospital.service.js');
const { validateHospitalSearch } = require('./hospital.validation');

async function listHospitals(req, res) {
  try {
    const { error, value } = validateHospitalSearch(req.query);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    const { search, city, specialty, limit, offset } = value;
    const hospitals = await hospitalService.getAllHospitals(search, city, specialty, limit, offset);
    res.json(hospitals);
  } catch (error) {
    console.error('listHospitals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getHospital(req, res) {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    console.error('getHospital error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getHospitalDoctors(req, res) {
  try {
    const doctors = await hospitalService.getDoctorsByHospitalId(req.params.id);
    res.json(doctors);
  } catch (error) {
    console.error('getHospitalDoctors error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getCities(req, res) {
  try {
    const cities = await hospitalService.getDistinctCities();
    res.json(cities);
  } catch (error) {
    console.error('getCities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSpecialties(req, res) {
  try {
    const specialties = await hospitalService.getDistinctSpecialties();
    res.json(specialties);
  } catch (error) {
    console.error('getSpecialties error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listHospitals,
  getHospital,
  getHospitalDoctors,
  getCities,
  getSpecialties
};
