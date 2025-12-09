import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Supplier } from '@/lib/types';

export async function GET() {
  try {
    const suppliersPath = path.join(process.cwd(), 'src/data/suppliers/netherlands.json');
    const suppliersData = JSON.parse(fs.readFileSync(suppliersPath, 'utf-8')) as Supplier[];

    return NextResponse.json(suppliersData);
  } catch (error) {
    console.error('Error loading suppliers:', error);
    return NextResponse.json({ error: 'Failed to load suppliers' }, { status: 500 });
  }
}