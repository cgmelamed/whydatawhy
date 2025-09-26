import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { data, question } = await req.json();

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

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
        ]
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

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error analyzing data:', error);

    // Return default visualization config
    const columns = Object.keys((await req.json()).data[0] || {});
    return NextResponse.json({
      visualization: {
        type: 'bar',
        xKey: columns[0] || 'x',
        yKey: columns[1] || columns[0] || 'y',
        title: 'Data Visualization'
      },
      questions: [
        'What are the main trends?',
        'What are the highest values?',
        'How does the data change over time?',
        'What patterns emerge from the data?'
      ]
    });
  }
}