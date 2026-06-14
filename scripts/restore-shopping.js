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
  const backupPath = path.join(__dirname, '../prisma/shopping_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at: ${backupPath}`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`Loaded ${items.length} items from backup file.`);

  // Create a default Shopping List
  console.log('Creating default shopping list...');
  let defaultList = await prisma.shoppingList.findFirst({
    where: { name: '基本のお買い物リスト' },
  });

  if (!defaultList) {
    defaultList = await prisma.shoppingList.create({
      data: { name: '基本のお買い物リスト' },
    });
    console.log(`Created new default list: ${defaultList.id}`);
  } else {
    console.log(`Found existing default list: ${defaultList.id}`);
  }

  // Restore items associated with the default list
  if (items.length > 0) {
    console.log('Restoring items...');
    const itemsToCreate = items.map((item) => ({
      id: item.id, // Keep original ID
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      isChecked: item.isChecked,
      recipeId: item.recipeId,
      shoppingListId: defaultList.id,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));

    // Check if any recipeIds in the backup items no longer exist in DB (to prevent foreign key constraint error)
    const validRecipeIds = (await prisma.recipe.findMany({ select: { id: true } })).map(r => r.id);
    
    const sanitizedItems = itemsToCreate.map(item => {
      if (item.recipeId && !validRecipeIds.includes(item.recipeId)) {
        console.warn(`Recipe with ID ${item.recipeId} not found for item ${item.name}. Unlinking recipe.`);
        return { ...item, recipeId: null };
      }
      return item;
    });

    await prisma.shoppingItem.createMany({
      data: sanitizedItems,
    });
    console.log(`Successfully restored ${sanitizedItems.length} items.`);
  } else {
    console.log('No items to restore.');
  }
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
