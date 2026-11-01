import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoProducts = JSON.parse(
  readFileSync(new URL('./data/products.json', import.meta.url), 'utf8'),
);

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@pawsstore.local';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin12345';

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin', passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'SAVE10' },
    update: { discountPercentage: 10, isActive: true, expiresAt: null },
    create: {
      code: 'SAVE10',
      discountPercentage: 10,
      isActive: true,
      expiresAt: null,
    },
  });

  for (const product of demoProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
        createdAt: new Date(product.createdAt),
      },
    });
  }

  console.log(
    `Seeded admin ${adminEmail}, promo code SAVE10 and ${demoProducts.length} demo products`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
