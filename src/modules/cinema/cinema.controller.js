const cinemaService = require('./cinema.service');
const ApiResponse = require('../../utils/apiResponse');

class CinemaController {
  async getNearby(req, res, next) {
    try {
      const { lat, lng, radius } = req.query;
      const cinemas = await cinemaService.getNearbyCinemas(Number(lat), Number(lng), Number(radius));
      return ApiResponse.success(res, cinemas, 'Nearby cinema halls fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const cinema = await cinemaService.getCinemaDetails(req.params.id);
      return ApiResponse.success(res, cinema, 'Cinema details fetched successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CinemaController();
