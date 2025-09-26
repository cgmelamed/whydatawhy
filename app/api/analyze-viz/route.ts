import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Changed from edge to support auth

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Please sign in to analyze data' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check rate limit
    const { allowed, remaining, isPro } = await checkRateLimit(user.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          remaining: 0,
          isPro: false,
          requiresUpgrade: true,
        },
        { status: 429 }
      );
    }

    const { data, question } = await req.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Increment usage
    await incrementUsage(user.id);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        visualization: {
          type: 'bar',
          xKey: Object.keys(data[0])[0],
          yKey: Object.keys(data[0])[1] || Object.keys(data[0])[0],
          title: 'Sample Visualization'
        },
        questions: [
          'What are the trends in this data?',
          'What are the top values?',
          'How does the data distribute?',
          'Are there any outliers?',
          'What patterns can we identify?'
        ],
        usage: { remaining, isPro }
      });
    }

    // Prepare data summary for GPT
    const columns = Object.keys(data[0]);
    const sampleData = data.slice(0, 10);

    const systemPrompt = `You are a data visualization expert. Analyze the provided data and suggest the best visualization configuration.

    Return a JSON object with:
    1. "visualization": Object with:
       - "type": "bar", "line", "pie", or "scatter"
       - "xKey": The column name to use for X axis
       - "yKey": The column name to use for Y axis
       - "title": A descriptive title for the chart
    2. "questions": Array of 5-7 specific, insightful questions about this data that would lead to interesting visualizations

    Make sure the xKey and yKey are actual column names from the data.`;

    const userPrompt = `Data columns: ${columns.join(', ')}

Sample data (first 10 rows):
${JSON.stringify(sampleData, null, 2)}

User question: ${question}

Analyze this data and suggest the best visualization for the question, along with other interesting questions to explore.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(response);

    // Validate the response
    if (!result.visualization || !result.questions) {
      throw new Error('Invalid response format');
    }

    // Ensure the keys exist in the data
    if (!columns.includes(result.visualization.xKey)) {
      result.visualization.xKey = columns[0];
    }
    if (!columns.includes(result.visualization.yKey)) {
      result.visualization.yKey = columns[1] || columns[0];
    }

    return NextResponse.json({
      ...result,
      usage: { remaining: remaining - 1, isPro }
    });

  } catch (error) {
    console.error('Error analyzing data:', error);

    // Return default visualization config
    return NextResponse.json({
      visualization: {
        type: 'bar',
        xKey: 'x',
        yKey: 'y',
        title: 'Data Visualization'
      },
      questions: [
        'What are the main trends?',
        'What are the highest values?',
        'How does the data change over time?',
        'What patterns emerge from the data?'
      ],
      error: 'Analysis failed'
    });
  }
}