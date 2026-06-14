import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

export async function POST(request: Request) {
  try {
    const { date, mealType, recipeId } = await request.json();

    if (!date || !mealType || !recipeId) {
      return NextResponse.json({ error: 'date, mealType, and recipeId are required' }, { status: 400 });
    }

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
