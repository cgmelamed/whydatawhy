import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

export const runtime = 'edge';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function parseFile(file: File): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result: any = {};
    workbook.SheetNames.forEach(sheetName => {
      result[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    });
    return result;
  } else if (fileName.endsWith('.json')) {
    const text = new TextDecoder().decode(buffer);
    return JSON.parse(text);
  } else if (fileName.endsWith('.txt')) {
    return new TextDecoder().decode(buffer);
  }

  throw new Error(`Unsupported file type: ${file.type}`);
}

function summarizeData(data: any): string {
  if (typeof data === 'string') {
    return data.substring(0, 1000);
  }

  if (Array.isArray(data)) {
    const sample = data.slice(0, 5);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    return `Data contains ${data.length} rows with columns: ${columns.join(', ')}\n\nSample data:\n${JSON.stringify(sample, null, 2)}`;
  }

  if (typeof data === 'object') {
    const summary: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        const columns = value.length > 0 ? Object.keys(value[0] as any) : [];
        summary.push(`Sheet "${key}": ${value.length} rows, columns: ${columns.join(', ')}`);
      }
    }
    return summary.join('\n');
  }

  return JSON.stringify(data).substring(0, 1000);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const message = formData.get('message') as string || '';
    const files = formData.getAll('files') as File[];

    let dataContext = '';

    for (const file of files) {
      try {
        const data = await parseFile(file);
        dataContext += `\n\nFile: ${file.name}\n${summarizeData(data)}`;
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        dataContext += `\n\nFile: ${file.name} - Error parsing file`;
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables."));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const systemPrompt = `You are a helpful data analysis assistant. You can analyze various types of data files including Excel spreadsheets, CSV files, JSON, and text files.

    When analyzing data:
    1. Provide clear insights and summaries
    2. Identify patterns and trends
    3. Answer specific questions about the data
    4. Suggest relevant follow-up analyses
    5. Be concise but thorough

    If no specific question is asked, provide a general summary of the data including key statistics and observations.`;

    const userPrompt = dataContext
      ? `${message || 'Please analyze this data and provide insights.'}\n\nData context:${dataContext}`
      : message || 'Hello! Please upload some data files and I can help you analyze them.';

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in analyze API:', error);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to process request' })}\n\n`));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      status: 500
    });
  }
}