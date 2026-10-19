const { prisma } = require('../../config/database');
const ApiError = require('../../utils/apiError');

class CinemaService {
  /**
   * Find cinema halls within radius (km) sorted by distance
   * Uses Haversine spherical distance formula at the PostgreSQL database level
   */
  async getNearbyCinemas(userLat, userLng, radiusKm = 20) {
    const cinemas = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        address, 
        city, 
        latitude, 
        longitude, 
        total_screens,
        ROUND(
          (6371 * acos(
            cos(radians(${userLat})) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${userLng})) + 
            sin(radians(${userLat})) * sin(radians(latitude))
          ))::numeric, 2
        ) AS distance_km
      FROM cinema_halls
      WHERE (
        6371 * acos(
          cos(radians(${userLat})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${userLng})) + 
          sin(radians(${userLat})) * sin(radians(latitude))
        )
      ) <= ${radiusKm}
      ORDER BY distance_km ASC;
    `;

    return cinemas;
  }

  async getCinemaDetails(cinemaId) {
    const cinema = await prisma.cinemaHall.findUnique({
      where: { id: cinemaId },
      include: {
        screens: {
          include: {
            shows: {
              where: {
                showTime: { gte: new Date() },
              },
              include: {
                movie: true,
              },
              orderBy: {
                showTime: 'asc',
              },
            },
          },
        },
      },
    });

    if (!cinema) {
      throw ApiError.notFound('Cinema hall not found');
    }

    return cinema;
  }
}

module.exports = new CinemaService();
