import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const lists = await prisma.shoppingList.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const list = await prisma.shoppingList.create({
      data: { name: name.trim() },
    });
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating shopping list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name || name.trim() === '') {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    const list = await prisma.shoppingList.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error updating shopping list:', error);
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

    await prisma.shoppingList.delete({
      where: { id },
    });

    // Auto-recreate default shopping list if all lists are deleted
    const count = await prisma.shoppingList.count();
    if (count === 0) {
      await prisma.shoppingList.create({
        data: { name: '基本のお買い物リスト' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
