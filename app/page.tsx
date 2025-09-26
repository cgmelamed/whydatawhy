'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { Upload, Send, X, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import MarkdownMessage from '@/components/MarkdownMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: FileInfo[];
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['xlsx', 'xls', 'csv', 'json', 'txt'].includes(ext || '');
      });
      setUploadedFiles([...uploadedFiles, ...newFiles]);
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

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const fileInfos: FileInfo[] = uploadedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      files: fileInfos.length > 0 ? fileInfos : undefined
    };

    setMessages(prev => [...prev, userMessage]);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);
    setInputValue('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', inputValue);
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: parsed.error }
                    : msg
                ));
                break;
              }

              if (parsed.content) {
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + parsed.content }
                    : msg
                ));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      setUploadedFiles([]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: 'Sorry, I encountered an error processing your request. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      setTimeout(scrollToBottom, 100);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return <FileSpreadsheet className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-800">WhyDataWhy</h1>
        <p className="text-sm text-gray-600 mt-1">Ask questions about your data using AI</p>
      </header>

      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-100 bg-opacity-90 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-24 h-24 mb-4 text-blue-600 mx-auto animate-bounce" />
            <p className="text-2xl font-bold text-blue-600">Drop your files here</p>
            <p className="text-lg mt-2 text-blue-500">Excel, CSV, JSON, and text files</p>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-full text-gray-500 transition-all duration-200 ${
                isDragging ? 'scale-105' : ''
              }`}
            >
              {isDragging ? (
                <>
                  <div className="border-4 border-dashed border-blue-400 rounded-lg p-12 bg-blue-50">
                    <Upload className="w-16 h-16 mb-4 text-blue-600 mx-auto" />
                    <p className="text-lg font-medium text-blue-600">Drop your files here</p>
                    <p className="text-sm mt-2 text-blue-500">Excel, CSV, JSON, and text files</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">Upload data and ask questions</p>
                  <p className="text-sm mt-2">Support for Excel, CSV, and other data formats</p>
                  <p className="text-xs mt-4 text-gray-400">Drag and drop files anywhere on the page</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {message.files && message.files.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {message.files.map((file, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 text-sm ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                            }`}
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <MarkdownMessage
                        content={message.content}
                        isStreaming={streamingMessageId === message.id}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".xlsx,.xls,.csv,.json,.txt"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Upload files"
            >
              <Upload className="w-5 h-5 text-gray-600" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your data..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}