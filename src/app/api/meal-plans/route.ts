import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const plans = await prisma.mealPlan.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        recipe: {
          include: {
            categories: true,
            ingredients: true,
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' },
      ],
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const MealPlanCreateSchema = z.object({
  date: z.string().min(1, '日付は必須です').refine((val) => !isNaN(Date.parse(val)), {
    message: '有効な日付形式で入力してください',
  }),
  mealType: z.enum(['朝食', '昼食', '夕食', 'その他']),
  recipeId: z.string().uuid('有効なレシピIDを入力してください'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = MealPlanCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力内容に不備があります', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { date, mealType, recipeId } = validation.data;

    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);

    // Upsert using the unique compound key to prevent duplicates
    const plan = await prisma.mealPlan.upsert({
      where: {
        date_mealType_recipeId: {
          date: cleanDate,
          mealType,
          recipeId,
        },
      },
      update: {}, // No updates needed if already exists
      create: {
        date: cleanDate,
        mealType,
        recipeId,
      },
      include: {
        recipe: {
          include: {
            categories: true,
            ingredients: true,
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.mealPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
