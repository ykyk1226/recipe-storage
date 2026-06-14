import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryIds = searchParams.get('category')?.split(',').filter(Boolean);
    const favorite = searchParams.get('favorite') === 'true';
    const ingredients = searchParams.get('ingredients')?.split(',').filter(Boolean);

    // Build the query object
    const where: Prisma.RecipeWhereInput = {};

    // Filter by favorite
    if (favorite) {
      where.isFavorite = true;
    }

    // Filter by categories (OR logic: has at least one of the selected categories)
    if (categoryIds && categoryIds.length > 0) {
      where.categories = {
        some: {
          id: {
            in: categoryIds,
          },
        },
      };
    }

    const andConditions: Prisma.RecipeWhereInput[] = [];

    // Filter by keyword search (title, description, or ingredients)
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          {
            ingredients: {
              some: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    // Filter by specific ingredients (AND logic: must contain ALL listed ingredients)
    if (ingredients && ingredients.length > 0) {
      ingredients.forEach((ing) => {
        andConditions.push({
          ingredients: {
            some: {
              name: { contains: ing, mode: 'insensitive' },
            },
          },
        });
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        categories: true,
        ingredients: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      servings,
      prepTime,
      cookTime,
      image,
      sourceUrl,
      isFavorite,
      ingredients,
      steps,
      categoryIds,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        servings: servings !== undefined ? Number(servings) : 2,
        prepTime: prepTime !== undefined && prepTime !== null ? Number(prepTime) : null,
        cookTime: cookTime !== undefined && cookTime !== null ? Number(cookTime) : null,
        image,
        sourceUrl,
        isFavorite: !!isFavorite,
        ingredients: {
          create: ingredients?.map((ing: any) => ({
            name: ing.name,
            amount: String(ing.amount),
            unit: String(ing.unit || ''),
          })) || [],
        },
        steps: {
          create: steps?.map((step: any, index: number) => ({
            stepNumber: step.stepNumber || index + 1,
            instruction: step.instruction,
            image: step.image,
          })) || [],
        },
        categories: {
          connect: categoryIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        categories: true,
        ingredients: true,
        steps: true,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
