# WhyDataWhy

A simple web application for analyzing data files using AI. Upload Excel, CSV, JSON, or text files and ask questions about your data.

## Features

- 📊 Support for multiple file formats (Excel, CSV, JSON, TXT)
- 💬 Chat-like interface for asking questions about data
- 🤖 AI-powered data analysis using OpenAI GPT
- 📁 Multiple file upload support
- 🚀 Ready for Vercel deployment

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_actual_api_key_here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Deploy with Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variable:**
   ```bash
   vercel env add OPENAI_API_KEY
   ```

### Option 2: Deploy via GitHub

1. Push this code to a GitHub repository

2. Go to [vercel.com](https://vercel.com) and import your repository

3. During setup, add the environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

4. Click "Deploy"

## Usage

1. **Upload Files**: Click the upload button to select Excel, CSV, JSON, or text files
2. **Ask Questions**: Type your question in the text field
3. **Get Insights**: The AI will analyze your data and provide insights

## Supported File Formats

- Excel (.xlsx, .xls)
- CSV (.csv)
- JSON (.json)
- Text (.txt)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | Your OpenAI API key for GPT access | Yes |

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **File Parsing**: xlsx library
- **Icons**: Lucide React

## Notes

- API calls have a 60-second timeout for large file processing
- The application uses GPT-4o-mini for cost-effective analysis
- Data is processed server-side for security
- Files are not permanently stored - they're processed and discarded