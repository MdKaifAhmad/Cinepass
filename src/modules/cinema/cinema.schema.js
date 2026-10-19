const { z } = require('zod');

const nearbyCinemasSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90, 'Invalid latitude'),
    lng: z.coerce.number().min(-180).max(180, 'Invalid longitude'),
    radius: z.coerce.number().positive().default(20),
  }),
});

const getCinemaByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid cinema ID'),
  }),
});

module.exports = {
  nearbyCinemasSchema,
  getCinemaByIdSchema,
};
