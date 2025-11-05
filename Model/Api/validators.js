const { body, param, validationResult } = require('express-validator');

const pacienteValidators = {
  create: [
    body('nombre').isString().trim().notEmpty().withMessage('nombre es requerido'),
    body('telefono').optional().isString().trim(),
    body('correo').optional().isEmail().withMessage('correo inválido'),
  ],
  update: [
    body('nombre').optional().isString().trim(),
    body('telefono').optional().isString().trim(),
    body('correo').optional().isEmail().withMessage('correo inválido'),
  ],
};

const medicoValidators = {
  create: [
    body('nombre').isString().trim().notEmpty().withMessage('nombre es requerido'),
    body('especialidad').optional().isString().trim(),
    body('telefono').optional().isString().trim(),
    body('correo').optional().isEmail().withMessage('correo inválido'),
  ],
  update: [
    body('nombre').optional().isString().trim(),
    body('especialidad').optional().isString().trim(),
    body('telefono').optional().isString().trim(),
    body('correo').optional().isEmail().withMessage('correo inválido'),
  ],
};

const citaValidators = {
  create: [
    body('paciente').isString().notEmpty().withMessage('paciente es requerido'),
    body('medico').isString().notEmpty().withMessage('medico es requerido'),
    body('fecha').isISO8601().withMessage('fecha debe ser YYYY-MM-DD'),
    body('hora').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('hora debe ser HH:mm'),
    body('estado').optional().isIn(['Programada', 'Cancelada', 'Completada']),
  ],
  update: [
    body('paciente').optional().isString(),
    body('medico').optional().isString(),
    body('fecha').optional().isISO8601().withMessage('fecha debe ser YYYY-MM-DD'),
    body('hora').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('hora debe ser HH:mm'),
    body('estado').optional().isIn(['Programada', 'Cancelada', 'Completada']),
  ],
};

// middleware to check validation result
function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.code = 'VALIDATION_ERROR';
    err.details = errors.array();
    return next(err);
  }
  return next();
}

module.exports = {
  pacienteValidators,
  medicoValidators,
  citaValidators,
  checkValidation,
};
