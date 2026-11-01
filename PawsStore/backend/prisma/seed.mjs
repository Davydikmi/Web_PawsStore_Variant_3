import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoProducts = JSON.parse(
  readFileSync(new URL('./data/products.json', import.meta.url), 'utf8'),
);

async function main() {
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
    `Seeded promo code SAVE10 and ${demoProducts.length} demo products`,
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
