/**
 * AI Legal Assistant Component
 * Real AI chat interface using existing UI components
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Loader2, Send, MessageSquare, Brain, AlertTriangle, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisType?: string;
  confidence?: number;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
  };
}

interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  metadata: {
    provider: string;
    tokensUsed: number;
    processingTime: number;
  };
}

export default function AiLegalAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Legal Assistant. I can help you with contract analysis, legal research, risk assessment, compliance checks, and document review. What can I assist you with today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>('legal_research');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          query: input.trim(),
          analysisType,
          jurisdiction: jurisdiction || undefined,
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiData: AIResponse = data.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData.response,
        timestamp: new Date(),
        analysisType,
        confidence: aiData.confidence,
        metadata: aiData.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const percentage = Math.round(confidence * 100);
    let variant: 'default' | 'secondary' | 'destructive' = 'default';
    let icon = <CheckCircle className="w-3 h-3" />;
    
    if (percentage < 60) {
      variant = 'destructive';
      icon = <AlertTriangle className="w-3 h-3" />;
    } else if (percentage < 80) {
      variant = 'secondary';
      icon = <AlertTriangle className="w-3 h-3" />;
    }
    
    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {icon}
        <span className="ml-1">{percentage}% confidence</span>
      </Badge>
    );
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Legal Assistant</h2>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Analysis Type:</label>
            <select 
              value={analysisType} 
              onChange={(e) => setAnalysisType(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="legal_research">Legal Research</option>
              <option value="contract">Contract Analysis</option>
              <option value="risk_assessment">Risk Assessment</option>
              <option value="compliance">Compliance Check</option>
              <option value="document_review">Document Review</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Jurisdiction:</label>
            <Input
              type="text"
              placeholder="e.g., nigeria, uae"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-32 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">
                      AI Assistant
                    </span>
                    {getConfidenceBadge(message.confidence)}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Provider: {message.metadata.provider} | 
                    Tokens: {message.metadata.tokensUsed} | 
                    Time: {message.metadata.processingTime}ms
                  </div>
                )}
                
                <div className="mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about legal matters, contracts, compliance, or any legal question..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Pro tip: Be specific about your jurisdiction and provide context for better results.
        </div>
      </div>
    </Card>
  );
}