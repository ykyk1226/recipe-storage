const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL env is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Fetching shopping items...');
  const items = await prisma.shoppingItem.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${items.length} items. Exporting to JSON...`);

  const backupDir = path.join(__dirname, '../prisma');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, 'shopping_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(items, null, 2), 'utf-8');

  console.log(`Backup completed successfully: ${backupPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
