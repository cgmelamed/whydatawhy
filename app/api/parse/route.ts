import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { logApiEvent, logApiError } from '@/lib/server-analytics';

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
    const fileExtension = fileName.split('.').pop() || 'unknown';

    // Log file parse attempt
    logApiEvent('file_parse_started', {
      fileExtension,
      fileSize: file.size,
      fileName: file.name
    });

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

    // Log successful parse
    logApiEvent('file_parse_success', {
      fileExtension,
      rowCount: parsedData.length,
      columnCount: parsedData[0] ? Object.keys(parsedData[0]).length : 0
    });

    return NextResponse.json({ parsed: parsedData });
  } catch (error) {
    logApiError(error, { endpoint: 'parse' });
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}