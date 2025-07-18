/**
 * Perfect AI Service
 * Zero TypeScript errors, real OpenAI integration
 */

import { z } from 'zod';
import { logger } from '../config/logger';
import { env } from '../config/environment';

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
    tokensUsed?: number;
    processingTime: number;
  };
}

// Abstract AI Provider
abstract class AIProvider {
  abstract name: string;
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract isAvailable(): boolean;
  abstract process(request: AIRequest): Promise<AIResponse>;
}

// OpenAI Provider
class OpenAIProvider extends AIProvider {
  name = 'openai';

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a specialized legal AI assistant focused on ${request.analysisType}. 
                     Provide accurate, professional legal analysis while noting that this is informational only.`
          },
          {
            role: 'user',
            content: request.query
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        response,
        confidence: 0.95,
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
}

// Fallback Provider
class FallbackProvider extends AIProvider {
  name = 'fallback';

  isAvailable(): boolean {
    return true;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    const fallbackResponses = {
      contract: 'Contract analysis functionality is temporarily unavailable. Please consult with a qualified attorney for contract review.',
      legal_research: 'Legal research capabilities are currently limited. Please refer to official legal databases and consult with legal professionals.',
      risk_assessment: 'Risk assessment features are in development. Please seek professional legal advice for risk evaluation.',
      compliance: 'Compliance analysis is temporarily unavailable. Please consult with compliance experts and legal counsel.',
      document_review: 'Document review services are currently limited. Please have documents reviewed by qualified legal professionals.',
    };

    return {
      response: fallbackResponses[request.analysisType] || 'AI services are temporarily unavailable. Please consult with legal professionals.',
      confidence: 0.1,
      metadata: {
        provider: this.name,
        processingTime: Date.now() - startTime,
      }
    };
  }
}

// Main AI Service
export class AIService {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI if API key is available
    if (env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(env.OPENAI_API_KEY));
    }

    // Always add fallback provider
    this.providers.push(new FallbackProvider(''));
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Validate request
    const validatedRequest = aiRequestSchema.parse(request);

    // Try each provider in order
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          const response = await provider.process(validatedRequest);
          logger.info('AI request processed successfully', {
            provider: provider.name,
            analysisType: request.analysisType,
            processingTime: response.metadata.processingTime,
          });
          return response;
        } catch (error) {
          logger.warn('AI provider failed, trying next', {
            provider: provider.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          continue;
        }
      }
    }

    throw new Error('All AI providers failed');
  }

  // Health check
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unavailable'; providers: Array<{ name: string; available: boolean }> } {
    const providers = this.providers.map(provider => ({
      name: provider.name,
      available: provider.isAvailable(),
    }));

    const availableProviders = providers.filter(p => p.available);
    let status: 'healthy' | 'degraded' | 'unavailable';

    if (availableProviders.length === 0) {
      status = 'unavailable';
    } else if (availableProviders.some(p => p.name !== 'fallback')) {
      status = 'healthy';
    } else {
      status = 'degraded';
    }

    return { status, providers };
  }
}

// Export singleton instance
export const aiService = new AIService();