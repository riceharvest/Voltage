import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { FlavorRecipe } from '@/lib/types';

export async function GET() {
  try {
    const flavorsDir = path.join(process.cwd(), 'src/data/flavors');
    const files = fs.readdirSync(flavorsDir).filter(file => file.endsWith('.json'));

    const flavors: FlavorRecipe[] = files.map(file => {
      try {
        const filePath = path.join(flavorsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as FlavorRecipe;
      } catch (error) {
        console.error(`Error loading flavor ${file}:`, error);
        return null;
      }
    }).filter(Boolean) as FlavorRecipe[];

    return NextResponse.json(flavors);
  } catch (error) {
    console.error('Error loading flavors:', error);
    return NextResponse.json({ error: 'Failed to load flavors' }, { status: 500 });
  }
}