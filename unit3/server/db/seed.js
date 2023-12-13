const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding the database.');
  try {
    // Clear the existing data using Prisma
    await prisma.$executeRaw`TRUNCATE "Student" CASCADE`;
    await prisma.$executeRaw`TRUNCATE "Instructor" CASCADE`;

    // Add 5 instructors using Prisma
    const instructors = await Promise.all(
      [...Array(5)].map(async () => {
        return prisma.instructor.create({
          data: {
            username: faker.internet.userName(),
            password: faker.internet.password(),
          },
        });
      })
    );

    // Add 4 students for each instructor using Prisma
    await Promise.all(
      [...Array(20)].map(async (_, i) => {
        const instructorId = instructors[i % 5].id; // Get the corresponding instructor ID
        await prisma.student.create({
          data: {
            name: faker.person.fullName(),
            cohort: faker.string.alphanumeric(4),
            instructor: {
              connect: { id: instructorId },
            },
          },
        });
      })
    );

    console.log('Database is seeded.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect(); // Disconnect from the Prisma client
  }
}

// Seed the database if we are running this file directly.
if (require.main === module) {
  seed();
}

module.exports = seed;
