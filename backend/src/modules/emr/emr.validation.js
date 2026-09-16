const Joi = require('joi');

const createPrescriptionSchema = Joi.object({
  appointmentId: Joi.string().uuid().allow(null).optional(),
  patientId: Joi.string().uuid().required(),
  diagnosis: Joi.string().trim().required(),
  instructions: Joi.string().trim().allow('', null),
  items: Joi.array().items(
    Joi.object({
      medicine_name: Joi.string().trim().required(),
      dosage: Joi.string().trim().required(),
      frequency: Joi.string().trim().required(),
      duration: Joi.string().trim().required(),
      instructions: Joi.string().trim().allow('', null)
    })
  ).required()
});

const getPrescriptionsSchema = Joi.object({
  patientId: Joi.string().uuid().optional()
});

module.exports = {
  createPrescriptionSchema,
  getPrescriptionsSchema
};
