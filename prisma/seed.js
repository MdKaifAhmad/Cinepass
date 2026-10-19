const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean old data to make seeding idempotent
  await prisma.payment.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.cinemaHall.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Demo User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      passwordHash,
      phone: '+919876543210',
    },
  });

  // 2. Seed Cinema Halls with real coordinates (New Delhi)
  const hallPVR = await prisma.cinemaHall.create({
    data: {
      name: 'PVR Plaza Connaught Place',
      address: 'H-Block, Connaught Circus',
      city: 'New Delhi',
      latitude: 28.6328,
      longitude: 77.2197,
      totalScreens: 2,
    },
  });

  const hallINOX = await prisma.cinemaHall.create({
    data: {
      name: 'INOX Nehru Place',
      address: 'Epicuria Mall, Nehru Place',
      city: 'New Delhi',
      latitude: 28.5501,
      longitude: 77.2515,
      totalScreens: 1,
    },
  });

  // 3. Create Screen & Seats
  const screen1 = await prisma.screen.create({
    data: {
      cinemaHallId: hallPVR.id,
      name: 'Audi 1 - IMAX',
      screenType: 'IMAX',
      totalSeats: 30,
    },
  });

  const rows = ['A', 'B', 'C'];
  const seatsData = [];

  for (const row of rows) {
    for (let num = 1; num <= 10; num++) {
      const category = row === 'C' ? 'RECLINER' : (row === 'B' ? 'PREMIUM' : 'REGULAR');
      const basePrice = row === 'C' ? 500 : (row === 'B' ? 350 : 250);

      seatsData.push({
        screenId: screen1.id,
        rowLabel: row,
        seatNumber: num,
        category,
        basePrice,
      });
    }
  }

  await prisma.seat.createMany({ data: seatsData });

  // 4. Seed Movie
  const movie = await prisma.movie.create({
    data: {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology.',
      genre: 'Sci-Fi / Action',
      durationMin: 148,
      language: 'English',
      releaseDate: new Date('2026-07-16'),
      rating: 8.8,
    },
  });

  // 5. Schedule Show for Tomorrow 7:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  await prisma.show.create({
    data: {
      movieId: movie.id,
      screenId: screen1.id,
      showTime: tomorrow,
      priceMultiplier: 1.0,
      version: 0,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
