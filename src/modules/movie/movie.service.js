const { prisma } = require('../../config/database');
const ApiError = require('../../utils/apiError');

class MovieService {
  async getAllMovies({ genre, language, search, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(genre && { genre: { contains: genre, mode: 'insensitive' } }),
      ...(language && { language: { equals: language, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { releaseDate: 'desc' },
      }),
      prisma.movie.count({ where }),
    ]);

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMovieById(id) {
    const movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      throw ApiError.notFound('Movie not found');
    }

    return movie;
  }

  async getMovieShows(movieId, { date }) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const shows = await prisma.show.findMany({
      where: {
        movieId,
        showTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        screen: {
          include: {
            cinemaHall: true,
          },
        },
      },
      orderBy: { showTime: 'asc' },
    });

    return shows;
  }
}

module.exports = new MovieService();
