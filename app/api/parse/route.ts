import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let parsedData: any[] = [];

    if (fileName.endsWith('.csv')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      parsedData = XLSX.utils.sheet_to_json(sheet);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      // For now, just take the first sheet
      const sheetName = workbook.SheetNames[0];
      parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (fileName.endsWith('.json')) {
      const text = new TextDecoder().decode(buffer);
      const data = JSON.parse(text);
      parsedData = Array.isArray(data) ? data : [data];
    }

    return NextResponse.json({ parsed: parsedData });
  } catch (error) {
    console.error('Error parsing file:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}