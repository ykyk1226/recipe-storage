import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        categories: true,
        ingredients: true,
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;
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

    // Execute atomic update in prisma transaction
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // 1. Update basic recipe properties and replace categories connections
      await tx.recipe.update({
        where: { id },
        data: {
          title,
          description,
          servings: servings !== undefined ? Number(servings) : undefined,
          prepTime: prepTime !== undefined ? (prepTime !== null ? Number(prepTime) : null) : undefined,
          cookTime: cookTime !== undefined ? (cookTime !== null ? Number(cookTime) : null) : undefined,
          image,
          sourceUrl,
          isFavorite: isFavorite !== undefined ? !!isFavorite : undefined,
          // Re-connect categories (disconnect all first, then connect current ones)
          categories: {
            set: categoryIds?.map((catId: string) => ({ id: catId })) || [],
          },
        },
      });

      // 2. Re-create ingredients (clear and create)
      if (ingredients !== undefined) {
        await tx.ingredient.deleteMany({
          where: { recipeId: id },
        });

        if (ingredients.length > 0) {
          await tx.ingredient.createMany({
            data: ingredients.map((ing: any) => ({
              recipeId: id,
              name: ing.name,
              amount: String(ing.amount),
              unit: String(ing.unit || ''),
            })),
          });
        }
      }

      // 3. Re-create steps (clear and create)
      if (steps !== undefined) {
        await tx.step.deleteMany({
          where: { recipeId: id },
        });

        if (steps.length > 0) {
          await tx.step.createMany({
            data: steps.map((step: any, index: number) => ({
              recipeId: id,
              stepNumber: step.stepNumber || index + 1,
              instruction: step.instruction,
              image: step.image,
            })),
          });
        }
      }

      // Fetch the fully updated entity
      return tx.recipe.findUnique({
        where: { id },
        include: {
          categories: true,
          ingredients: true,
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<any> }
) {
  try {
    const { id } = await context.params;

    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }
    }
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
