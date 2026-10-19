const movieService = require('./movie.service');
const ApiResponse = require('../../utils/apiResponse');

class MovieController {
  async getAll(req, res, next) {
    try {
      const result = await movieService.getAllMovies(req.query);
      return ApiResponse.success(res, result, 'Movies fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const movie = await movieService.getMovieById(req.params.id);
      return ApiResponse.success(res, movie, 'Movie details fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  async getShows(req, res, next) {
    try {
      const shows = await movieService.getMovieShows(req.params.id, req.query);
      return ApiResponse.success(res, shows, 'Movie shows fetched successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MovieController();
