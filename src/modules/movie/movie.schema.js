const { z } = require('zod');

const listMoviesSchema = z.object({
  query: z.object({
    genre: z.string().optional(),
    language: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

const getMovieByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid movie ID'),
  }),
});

module.exports = {
  listMoviesSchema,
  getMovieByIdSchema,
};
