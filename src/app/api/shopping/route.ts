import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const ShoppingItemCreateSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  amount: z.string().max(50, '分量は50文字以内で入力してください').nullable().optional(),
  unit: z.string().max(50, '単位は50文字以内で入力してください').nullable().optional(),
  recipeId: z.string().uuid().nullable().optional(),
  shoppingListId: z.string().uuid().nullable().optional(),
});

const ShoppingItemBatchCreateSchema = z.array(ShoppingItemCreateSchema);

const ShoppingItemUpdateSchema = z.object({
  id: z.string().uuid('有効なIDを入力してください'),
  isChecked: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  amount: z.string().max(50).nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let listId = searchParams.get('listId');

    // Fallback to first available shopping list if listId is not provided
    if (!listId || listId === 'undefined' || listId === 'null') {
      const defaultList = await prisma.shoppingList.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      listId = defaultList?.id || '';
    }

    const items = await prisma.shoppingItem.findMany({
      where: {
        shoppingListId: listId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        recipe: {
          select: { title: true },
        },
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get fallback list ID
    const defaultList = await prisma.shoppingList.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    const fallbackListId = defaultList?.id || '';

    // Support batch adding from recipes (body is array)
    if (Array.isArray(body)) {
      const validation = ShoppingItemBatchCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: '入力内容に不備があります', details: validation.error.format() },
          { status: 400 }
        );
      }

      const itemsData = validation.data.map((item) => ({
        name: item.name,
        amount: item.amount || null,
        unit: item.unit || null,
        recipeId: item.recipeId || null,
        shoppingListId: item.shoppingListId || fallbackListId,
      }));

      await prisma.shoppingItem.createMany({
        data: itemsData,
      });

      // Return items for the target list (use the first item's listId as reference)
      const targetListId = itemsData[0]?.shoppingListId || fallbackListId;
      const items = await prisma.shoppingItem.findMany({
        where: { shoppingListId: targetListId },
        orderBy: { createdAt: 'asc' },
        include: {
          recipe: {
            select: { title: true },
          },
        },
      });

      return NextResponse.json(items, { status: 201 });
    } else {
      const validation = ShoppingItemCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: '入力内容に不備があります', details: validation.error.format() },
          { status: 400 }
        );
      }

      const { name, amount, unit, recipeId, shoppingListId } = validation.data;

      const item = await prisma.shoppingItem.create({
        data: {
          name,
          amount: amount || null,
          unit: unit || null,
          recipeId: recipeId || null,
          shoppingListId: shoppingListId || fallbackListId,
        },
        include: {
          recipe: {
            select: { title: true },
          },
        },
      });

      return NextResponse.json(item, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating shopping item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = ShoppingItemUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力内容に不備があります', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, isChecked, name, amount, unit } = validation.data;

    const item = await prisma.shoppingItem.update({
      where: { id },
      data: {
        isChecked,
        name,
        amount: amount !== undefined ? (amount || null) : undefined,
        unit: unit !== undefined ? (unit || null) : undefined,
      },
      include: {
        recipe: {
          select: { title: true },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating shopping item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const listId = searchParams.get('listId');
    const clearChecked = searchParams.get('clearChecked') === 'true';
    const clearAll = searchParams.get('clearAll') === 'true';

    // Clear all checked items for a specific list
    if (clearChecked && listId) {
      await prisma.shoppingItem.deleteMany({
        where: {
          shoppingListId: listId,
          isChecked: true,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Clear all items for a specific list
    if (clearAll && listId) {
      await prisma.shoppingItem.deleteMany({
        where: {
          shoppingListId: listId,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Default individual item delete
    if (!id) {
      return NextResponse.json({ error: 'ID or clear query parameter is required' }, { status: 400 });
    }

    await prisma.shoppingItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
