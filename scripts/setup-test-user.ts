import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 12);

  // First, update all existing users to have the test password
  const allUsers = await prisma.user.findMany();
  console.log(`Found ${allUsers.length} existing users`);

  for (const user of allUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    console.log(`Updated password for ${user.email}`);
  }

  // Then, create or update the main test user
  const testUser = await prisma.user.upsert({
    where: { email: "dannyallport@icloud.com" },
    update: { password: hashedPassword },
    create: {
      email: "dannyallport@icloud.com",
      name: "Danny Allport",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`✓ User ${testUser.email} is ready with password: ${password}`);
}

main()
  .then(() => {
    console.log("✓ Setup complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
