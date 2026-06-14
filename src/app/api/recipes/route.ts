import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

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

const RecipeCreateSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').nullable().optional(),
  servings: z.number().int().min(1).max(100).default(2),
  prepTime: z.number().int().min(0).max(1440).nullable().optional(),
  cookTime: z.number().int().min(0).max(1440).nullable().optional(),
  image: z.string().max(100000).nullable().optional(), // Supports Base64/long paths
  sourceUrl: z.string().max(1000).nullable().optional(),
  isFavorite: z.boolean().default(false),
  ingredients: z.array(z.object({
    name: z.string().min(1, '材料名は必須です').max(100, '材料名は100文字以内で入力してください'),
    amount: z.string().max(50, '分量は50文字以内で入力してください').default(''),
    unit: z.string().max(20, '単位は20文字以内で入力してください').default(''),
  })).optional(),
  steps: z.array(z.object({
    stepNumber: z.number().int().min(1).optional(),
    instruction: z.string().min(1, '手順の説明は必須です').max(1000, '手順説明は1000文字以内で入力してください'),
    image: z.string().max(100000).nullable().optional(),
  })).optional(),
  categoryIds: z.array(z.string().uuid('有効なカテゴリIDを入力してください')).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = RecipeCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力内容に不備があります', details: validation.error.format() },
        { status: 400 }
      );
    }

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
    } = validation.data;

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        servings,
        prepTime,
        cookTime,
        image,
        sourceUrl,
        isFavorite,
        ingredients: {
          create: ingredients?.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })) || [],
        },
        steps: {
          create: steps?.map((step, index) => ({
            stepNumber: step.stepNumber || index + 1,
            instruction: step.instruction,
            image: step.image,
          })) || [],
        },
        categories: {
          connect: categoryIds?.map((id) => ({ id })) || [],
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
