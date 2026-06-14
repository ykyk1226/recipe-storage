const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // カテゴリの作成
  const mainDish = await prisma.category.upsert({
    where: { name: '主菜' },
    update: {},
    create: { name: '主菜', color: '#ef4444' }, // 赤
  });

  const sideDish = await prisma.category.upsert({
    where: { name: '副菜' },
    update: {},
    create: { name: '副菜', color: '#3b82f6' }, // 青
  });

  const soup = await prisma.category.upsert({
    where: { name: '汁物' },
    update: {},
    create: { name: '汁物', color: '#10b981' }, // 緑
  });

  const dessert = await prisma.category.upsert({
    where: { name: 'デザート' },
    update: {},
    create: { name: 'デザート', color: '#ec4899' }, // ピンク
  });

  console.log('Categories seeded.');

  // サンプルレシピの作成
  const recipe1 = await prisma.recipe.create({
    data: {
      title: '簡単ハンバーグ',
      description: 'ジューシーで美味しい家庭的なハンバーグです。',
      servings: 2,
      prepTime: 15,
      cookTime: 15,
      isFavorite: true,
      categories: {
        connect: [{ id: mainDish.id }]
      },
      ingredients: {
        create: [
          { name: '合い挽き肉', amount: '300', unit: 'g' },
          { name: '玉ねぎ', amount: '1/2', unit: '個' },
          { name: 'パン粉', amount: '大さじ3', unit: '' },
          { name: '牛乳', amount: '大さじ2', unit: '' },
          { name: '卵', amount: '1', unit: '個' },
          { name: '塩・コショウ', amount: '少々', unit: '' }
        ]
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: '玉ねぎをみじん切りにし、フライパンでしんなりするまで炒めて冷まします。' },
          { stepNumber: 2, instruction: 'ボウルにひき肉、塩・コショウを入れてよくこね、冷ました玉ねぎと他の材料を加えてさらに混ぜます。' },
          { stepNumber: 3, instruction: '2等分にして空気を抜き、楕円形に成形します。中央を少しくぼませます。' },
          { stepNumber: 4, instruction: 'フライパンに油を熱し、強火で両面に焼き色をつけたら、弱火にして蓋をし、中まで火を通します。' }
        ]
      }
    }
  });

  const recipe2 = await prisma.recipe.create({
    data: {
      title: 'わかめとお豆腐のお味噌汁',
      description: '定番中の定番、ほっとする味わいのお味噌汁です。',
      servings: 2,
      prepTime: 5,
      cookTime: 5,
      isFavorite: false,
      categories: {
        connect: [{ id: soup.id }]
      },
      ingredients: {
        create: [
          { name: '豆腐', amount: '1/2', unit: '丁' },
          { name: '乾燥わかめ', amount: '大さじ1', unit: '' },
          { name: 'だし汁', amount: '400', unit: 'ml' },
          { name: '味噌', amount: '大さじ1.5', unit: '' }
        ]
      },
      steps: {
        create: [
          { stepNumber: 1, instruction: '豆腐は1.5cm角に切ります。わかめは水で戻しておきます。' },
          { stepNumber: 2, instruction: '鍋にだし汁を入れて沸騰させ、豆腐を加えます。' },
          { stepNumber: 3, instruction: '再び沸騰したら弱火にし、味噌を溶き入れます。' },
          { stepNumber: 4, instruction: 'わかめを加え、ひと煮立ちする直前に火を止めます。' }
        ]
      }
    }
  });

  console.log('Sample recipes seeded:', recipe1.title, recipe2.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Connection pool clean up
  });
