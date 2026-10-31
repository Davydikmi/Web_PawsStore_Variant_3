import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  console.log('Seeded promo code SAVE10 (10% discount)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
