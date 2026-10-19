const { Router } = require('express');
const cinemaController = require('./cinema.controller');
const validate = require('../../middleware/validate');
const { nearbyCinemasSchema, getCinemaByIdSchema } = require('./cinema.schema');

const router = Router();

router.get('/nearby', validate(nearbyCinemasSchema), cinemaController.getNearby);
router.get('/:id', validate(getCinemaByIdSchema), cinemaController.getById);

module.exports = router;
