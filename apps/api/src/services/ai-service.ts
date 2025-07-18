/**
 * Simplified AI Service
 * Real AI integration without over-engineering
 */

import { z } from 'zod';
import { logger } from '../config/logger';
import { env, features } from '../config/environment';

// AI Request/Response Types
const aiRequestSchema = z.object({
  query: z.string().min(1).max(5000),
  jurisdiction: z.string().optional(),
  language: z.enum(['en', 'fr', 'ar', 'pt', 'sw']).default('en'),
  analysisType: z.enum([
    'contract',
    'legal_research',
    'risk_assessment',
    'compliance',
    'document_review'
  ]).default('legal_research'),
  context: z.record(z.any()).optional(),
});

export type AIRequest = z.infer<typeof aiRequestSchema>;

export interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  metadata: {
    provider: string;
    tokensUsed: number;
    processingTime: number;
  };
}

// AI Provider Interface
abstract class AIProvider {
  abstract name: string;
  abstract isAvailable(): boolean;
  abstract process(request: AIRequest): Promise<AIResponse>;
}

// OpenAI Provider
class OpenAIProvider extends AIProvider {
  name = 'openai';
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = env.OPENAI_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    
    try {
      // Import OpenAI dynamically to avoid requiring it if not used
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      const prompt = this.buildLegalPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a legal AI assistant specializing in ${request.jurisdiction || 'international'} law. 
                     Provide accurate, helpful legal information while noting that this is not legal advice.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        response,
        confidence: 0.85,
        metadata: {
          provider: this.name,
          tokensUsed,
          processingTime: Date.now() - startTime,
        }
      };
    } catch (error) {
      logger.error('OpenAI API error', { error, request: request.query });
      throw new Error('Failed to process request with OpenAI');
    }
  }

  private buildLegalPrompt(request: AIRequest): string {
    switch (request.analysisType) {
      case 'contract':
        return `Analyze the following contract clause or document for legal issues, risks, and recommendations:\n\n${request.query}`;
      
      case 'legal_research':
        return `Research the following legal question and provide relevant laws, cases, and analysis:\n\n${request.query}`;
      
      case 'risk_assessment':
        return `Assess the legal risks in the following scenario and provide mitigation strategies:\n\n${request.query}`;
      
      case 'compliance':
        return `Review the following for compliance with applicable laws and regulations:\n\n${request.query}`;
      
      case 'document_review':
        return `Review the following legal document for completeness, accuracy, and potential issues:\n\n${request.query}`;
      
      default:
        return request.query;
    }
  }
}

// Anthropic Provider
class AnthropicProvider extends AIProvider {
  name = 'anthropic';
  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = env.ANTHROPIC_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const startTime = Date.now();
    
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: this.apiKey });

      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `As a legal AI assistant, please help with this ${request.analysisType} query: ${request.query}`
          }
        ]
      });

      const response = message.content[0]?.type === 'text' ? message.content[0].text : '';
      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

      return {
        response,
        confidence: 0.90,
        metadata: {
          provider: this.name,
          tokensUsed,
          processingTime: Date.now() - startTime,
        }
      };
    } catch (error) {
      logger.error('Anthropic API error', { error, request: request.query });
      throw new Error('Failed to process request with Anthropic');
    }
  }
}

// Local AI Provider (Ollama integration)
class LocalProvider extends AIProvider {
  name = 'local';

  isAvailable(): boolean {
    // In a real implementation, check if Ollama is running
    return false;
  }

  async process(_request: AIRequest): Promise<AIResponse> {
    // Real implementation would connect to local Ollama instance
    throw new Error('Local AI provider not yet implemented');
  }
}

// Main AI Service
export class AIService {
  private providers: AIProvider[] = [];
  private cache = new Map<string, { response: AIResponse; expires: number }>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers based on available configuration
    if (features.ai.openai) {
      this.providers.push(new OpenAIProvider());
    }
    
    if (features.ai.anthropic) {
      this.providers.push(new AnthropicProvider());
    }
    
    // Always add local provider (for future Ollama integration)
    this.providers.push(new LocalProvider());

    logger.info('AI Service initialized', {
      availableProviders: this.providers
        .filter(p => p.isAvailable())
        .map(p => p.name)
    });
  }

  async processRequest(input: unknown): Promise<AIResponse> {
    // Validate input
    const request = aiRequestSchema.parse(input);
    
    // Check cache
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      logger.info('AI request served from cache', { query: request.query.substring(0, 100) });
      return cached;
    }

    // Find available provider
    const provider = this.providers.find(p => p.isAvailable());
    if (!provider) {
      throw new Error('No AI providers available');
    }

    try {
      const response = await provider.process(request);
      
      // Cache successful response for 1 hour
      this.cacheResponse(cacheKey, response, 3600000);
      
      logger.info('AI request processed successfully', {
        provider: provider.name,
        tokensUsed: response.metadata.tokensUsed,
        processingTime: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      logger.error('AI request failed', { 
        provider: provider.name, 
        error,
        query: request.query.substring(0, 100)
      });
      
      // Try fallback provider if available
      const fallbackProvider = this.providers.find(p => 
        p.isAvailable() && p.name !== provider.name
      );
      
      if (fallbackProvider) {
        logger.info('Trying fallback provider', { provider: fallbackProvider.name });
        return await fallbackProvider.process(request);
      }
      
      throw new Error('All AI providers failed to process request');
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: string; providers: any[] }> {
    const providerStatus = this.providers.map(provider => ({
      name: provider.name,
      available: provider.isAvailable(),
    }));

    const hasAvailableProvider = providerStatus.some(p => p.available);

    return {
      status: hasAvailableProvider ? 'healthy' : 'degraded',
      providers: providerStatus,
    };
  }

  private generateCacheKey(request: AIRequest): string {
    return `ai:${request.analysisType}:${request.jurisdiction}:${request.language}:${Buffer.from(request.query).toString('base64')}`;
  }

  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.response;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResponse(key: string, response: AIResponse, ttlMs: number): void {
    this.cache.set(key, {
      response,
      expires: Date.now() + ttlMs,
    });
  }
}

// Export singleton instance
export const aiService = new AIService();