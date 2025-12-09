import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Ingredient } from '@/lib/types';

export async function GET() {
  try {
    const ingredientsPath = path.join(process.cwd(), 'src/data/ingredients/ingredients.json');
    const ingredientsData = JSON.parse(fs.readFileSync(ingredientsPath, 'utf-8')) as Ingredient[];

    return NextResponse.json(ingredientsData);
  } catch (error) {
    console.error('Error loading ingredients:', error);
    return NextResponse.json({ error: 'Failed to load ingredients' }, { status: 500 });
  }
}