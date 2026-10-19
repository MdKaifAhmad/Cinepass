const { Router } = require('express');
const movieController = require('./movie.controller');
const validate = require('../../middleware/validate');
const { listMoviesSchema, getMovieByIdSchema } = require('./movie.schema');

const router = Router();

router.get('/', validate(listMoviesSchema), movieController.getAll);
router.get('/:id', validate(getMovieByIdSchema), movieController.getById);
router.get('/:id/shows', validate(getMovieByIdSchema), movieController.getShows);

module.exports = router;
