const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const email = (process.argv[2] || 'demouser@gmail.com').toLowerCase().trim();
const password = process.argv[3] || 'Mani123@!!';
const name = process.argv[4] || 'Demo Admin';

async function main() {
  const prisma = new PrismaClient();
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: 'ADMIN',
      name,
    },
    create: {
      email,
      password: hashed,
      name,
      company: 'Printoe',
      role: 'ADMIN',
    },
  });
  console.log('Admin ready:', { id: user.id, email: user.email, role: user.role });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
