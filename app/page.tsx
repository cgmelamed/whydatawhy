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
      className="flex flex-col h-screen bg-white"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-20 h-20 mb-6 text-gray-900 mx-auto animate-pulse stroke-1" />
            <p className="font-serif text-display text-gray-900">Drop your file</p>
            <p className="text-sm mt-4 text-gray-500 font-light">Excel · CSV · JSON</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {!uploadedData ? (
        // Upload screen
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <h1 className="font-serif text-hero text-gray-900 mb-6">
              Why, data, why?
            </h1>
            <p className="text-lg font-light text-gray-600 mb-16 tracking-wide">
              Ask questions about your data in plain English
            </p>

            <div className="border border-gray-200 rounded-xl p-16 bg-gray-50/50 hover:border-gray-400 transition-all hover:shadow-lg">
              <Upload className="w-10 h-10 mb-6 text-gray-400 mx-auto stroke-1" />
              <p className="text-base font-light text-gray-700 mb-3">Drop your data file here</p>
              <p className="text-sm text-gray-400 mb-8 font-light">or</p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".xlsx,.xls,.csv,.json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-black transition-all font-light tracking-wide text-sm"
              >
                Browse Files
              </button>

              <p className="text-xs text-gray-400 mt-8 font-light tracking-wide">
                Excel · CSV · JSON
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Minimal header when data is loaded */}
          <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
              <FileSpreadsheet className="w-4 h-4 stroke-1" />
              <span>{uploadedData.name}</span>
            </div>
            <button
              onClick={clearData}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1"
              title="Clear data"
            >
              <X className="w-4 h-4 stroke-1" />
            </button>
          </header>

          {/* Three-column layout */}
          <div className="flex-1 flex overflow-hidden">
          {/* Left: Data Grid */}
          <div className="w-1/3 border-r bg-white">
            <DataGrid data={uploadedData.data} title="Data View" />
          </div>

          {/* Center: Visualization */}
          <div className="flex-1 bg-white border-r">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
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
      </>
      )}
    </div>
  );
}