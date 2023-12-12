const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function seedDatabase() {
  // Create at least 3 users
  await prisma.user.createMany({
    data: [
      { username: "john", password: await bcrypt.hash("password1", 10) },
      { username: "mark", password: await bcrypt.hash("password2", 10) },
      { username: "luke", password: await bcrypt.hash("password3", 10) },
      { username: "matthew", password: await bcrypt.hash("password4", 10) },
    ],
  });

  // Retrieve the newly created users
  const users = await prisma.user.findMany();

  for (const user of users) {
    // Create 3 posts for each user
    await prisma.post.createMany({
      data: [
        { title: "Post 1", content: "Content1", userId: user.id },
        { title: "Post 2", content: "Content2", userId: user.id },
        { title: "Post 3", content: "Content3", userId: user.id },
      ],
    });
  }

  console.log("Database seeded successfully");
}

seedDatabase()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
