'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, FileText, Loader2, BarChart3 } from 'lucide-react';
import DataGrid from '@/components/DataGrid';
import DataVisualization from '@/components/DataVisualization';
import SuggestedQuestions from '@/components/SuggestedQuestions';

interface FileData {
  name: string;
  data: any[];
  type: string;
}

interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  xKey: string;
  yKey: string;
  title: string;
  data: any[];
}

export default function Home() {
  const [uploadedData, setUploadedData] = useState<FileData | null>(null);
  const [visualization, setVisualization] = useState<VisualizationConfig | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const parseFile = async (file: File): Promise<any[]> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to parse file');
      const data = await response.json();
      return data.parsed;
    } catch (error) {
      console.error('Error parsing file:', error);
      return [];
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);

    try {
      // Parse the file
      const parsedData = await parseFile(file);

      if (parsedData.length > 0) {
        setUploadedData({
          name: file.name,
          data: parsedData,
          type: file.type
        });

        // Generate initial visualization and questions
        await analyzeData(parsedData, 'Generate an initial visualization of this data');
      }
    } catch (error) {
      console.error('Error handling file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeData = async (data: any[], question: string) => {
    setIsLoading(true);
    setCurrentQuestion(question);

    try {
      const response = await fetch('/api/analyze-viz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.slice(0, 100), question }), // Send sample for analysis
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const result = await response.json();

      // Update visualization
      if (result.visualization) {
        setVisualization({
          type: result.visualization.type || 'bar',
          xKey: result.visualization.xKey,
          yKey: result.visualization.yKey,
          title: result.visualization.title || question,
          data: data
        });
      }

      // Update suggested questions
      if (result.questions) {
        setSuggestedQuestions(result.questions);
      }
    } catch (error) {
      console.error('Error analyzing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    if (uploadedData) {
      analyzeData(uploadedData.data, question);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearData = () => {
    setUploadedData(null);
    setVisualization(null);
    setSuggestedQuestions([]);
    setCurrentQuestion('');
  };

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">WhyDataWhy</h1>
        </div>
        {uploadedData && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{uploadedData.name}</span>
            </div>
            <button
              onClick={clearData}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Clear data"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-100 bg-opacity-90 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-24 h-24 mb-4 text-blue-600 mx-auto animate-bounce" />
            <p className="text-2xl font-bold text-blue-600">Drop your data file here</p>
            <p className="text-lg mt-2 text-blue-500">Excel, CSV, JSON files supported</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {!uploadedData ? (
        // Upload screen
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-16 h-16 mb-4 text-gray-400 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Upload your data</h2>
            <p className="text-gray-500 mb-6">Drop a file here or click to browse</p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Supports Excel (.xlsx, .xls), CSV, and JSON files
            </p>
          </div>
        </div>
      ) : (
        // Three-column layout
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Data Grid */}
          <div className="w-1/3 border-r bg-white">
            <DataGrid data={uploadedData.data} title="Data View" />
          </div>

          {/* Center: Visualization */}
          <div className="flex-1 bg-white border-r">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : visualization ? (
              <DataVisualization
                data={visualization.data}
                chartType={visualization.type}
                xKey={visualization.xKey}
                yKey={visualization.yKey}
                title={visualization.title}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mb-4 text-gray-400 mx-auto" />
                  <p>Select a question to visualize your data</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Suggested Questions */}
          <div className="w-80 bg-white">
            <SuggestedQuestions
              questions={suggestedQuestions}
              onQuestionClick={handleQuestionClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}