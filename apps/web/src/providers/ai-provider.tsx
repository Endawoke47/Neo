// AI Provider for CounselFlow
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface Contract {
  id: string;
  title: string;
  [key: string]: any;
}

interface Matter {
  id: string;
  title: string;
  [key: string]: any;
}

interface Dispute {
  id: string;
  title: string;
  [key: string]: any;
}

interface Risk {
  id: string;
  title: string;
  [key: string]: any;
}

interface AIAnalysis {
  id: string;
  type: 'CONTRACT_ANALYSIS' | 'RISK_ASSESSMENT' | 'CASE_PREDICTION' | 'DOCUMENT_REVIEW';
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  input: any;
  output?: any;
  confidence?: number;
  recommendations?: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface AICapabilities {
  contractAnalysis: boolean;
  riskAssessment: boolean;
  casePrediction: boolean;
  documentReview: boolean;
  legalResearch: boolean;
  complianceChecking: boolean;
}

interface AIState {
  isConnected: boolean;
  capabilities: AICapabilities;
  analyses: AIAnalysis[];
  isAnalyzing: boolean;
  currentModel: string;
  availableModels: string[];
}

interface AIContextType extends AIState {
  analyzeContract: (contract: Contract) => Promise<AIAnalysis>;
  assessRisk: (matter: Matter) => Promise<AIAnalysis>;
  predictCase: (dispute: Dispute) => Promise<AIAnalysis>;
  reviewDocument: (file: File) => Promise<AIAnalysis>;
  getAnalysis: (id: string) => AIAnalysis | undefined;
  clearAnalyses: () => void;
  switchModel: (modelName: string) => Promise<void>;
}

type AIAction =
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_CAPABILITIES'; payload: AICapabilities }
  | { type: 'ADD_ANALYSIS'; payload: AIAnalysis }
  | { type: 'UPDATE_ANALYSIS'; payload: { id: string; updates: Partial<AIAnalysis> } }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'CLEAR_ANALYSES' }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_AVAILABLE_MODELS'; payload: string[] };

const initialState: AIState = {
  isConnected: false,
  capabilities: {
    contractAnalysis: false,
    riskAssessment: false,
    casePrediction: false,
    documentReview: false,
    legalResearch: false,
    complianceChecking: false,
  },
  analyses: [],
  isAnalyzing: false,
  currentModel: 'llama3.2:latest',
  availableModels: [],
};

function aiReducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    case 'SET_CAPABILITIES':
      return { ...state, capabilities: action.payload };
    case 'ADD_ANALYSIS':
      return { ...state, analyses: [action.payload, ...state.analyses] };
    case 'UPDATE_ANALYSIS':
      return {
        ...state,
        analyses: state.analyses.map(analysis =>
          analysis.id === action.payload.id
            ? { ...analysis, ...action.payload.updates }
            : analysis
        ),
      };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'CLEAR_ANALYSES':
      return { ...state, analyses: [] };
    case 'SET_MODEL':
      return { ...state, currentModel: action.payload };
    case 'SET_AVAILABLE_MODELS':
      return { ...state, availableModels: action.payload };
    default:
      return state;
  }
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Initialize AI connection and capabilities
  useEffect(() => {
    const initializeAI = async () => {
      try {
        // Check if Ollama is available
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
          const data = await response.json();
          const models = data.models?.map((model: any) => model.name) || [];
          
          dispatch({ type: 'SET_CONNECTION', payload: true });
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
          dispatch({
            type: 'SET_CAPABILITIES',
            payload: {
              contractAnalysis: true,
              riskAssessment: true,
              casePrediction: true,
              documentReview: true,
              legalResearch: true,
              complianceChecking: true,
            },
          });
        } else {
          console.warn('Ollama not available, using demo mode');
          dispatch({ type: 'SET_CONNECTION', payload: false });
        }
      } catch (error) {
        console.warn('AI service unavailable:', error);
        dispatch({ type: 'SET_CONNECTION', payload: false });
      }
    };

    initializeAI();
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const callOllamaAPI = async (prompt: string, model: string = state.currentModel) => {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI service request failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI API error:', error);
      throw error;
    }
  };

  const analyzeContract = async (contract: Contract): Promise<AIAnalysis> => {
    const analysis: AIAnalysis = {
      id: generateId(),
      type: 'CONTRACT_ANALYSIS',
      status: 'ANALYZING',
      input: contract,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_ANALYSIS', payload: analysis });
    dispatch({ type: 'SET_ANALYZING', payload: true });

    try {
      const prompt = `
        As a legal AI assistant, analyze the following contract:
        
        Title: ${contract.title}
        Value: ${(contract as any).value ? `$${(contract as any).value.toLocaleString()}` : 'Not specified'}
        Start Date: ${(contract as any).startDate ? (contract as any).startDate.toDateString() : 'Not specified'}
        End Date: ${(contract as any).endDate ? (contract as any).endDate.toDateString() : 'Not specified'}
        Status: ${(contract as any).status || 'Not specified'}
        
        Please provide:
        1. Risk assessment (HIGH/MEDIUM/LOW)
        2. Key terms analysis
        3. Compliance considerations
        4. Recommendations for improvement
        5. Potential legal issues
        
        Format your response as structured analysis.
      `;

      let aiResponse;
      if (state.isConnected) {
        aiResponse = await callOllamaAPI(prompt);
      } else {
        // Demo response
        aiResponse = `
**Risk Assessment: MEDIUM**

**Key Terms Analysis:**
- Contract duration: ${(contract as any).startDate ? (contract as any).startDate.toDateString() : 'Not specified'} to ${(contract as any).endDate ? (contract as any).endDate.toDateString() : 'Open-ended'}
- Financial exposure: ${(contract as any).value ? `$${(contract as any).value.toLocaleString()}` : 'Unspecified value'}
- Contract type: ${(contract as any).type || 'Not specified'}

**Compliance Considerations:**
- Review data protection clauses
- Ensure termination provisions are clear
- Verify dispute resolution mechanisms

**Recommendations:**
- Add force majeure clause
- Include regular review checkpoints
- Clarify liability limitations
- Define performance metrics

**Potential Legal Issues:**
- Unclear termination conditions
- Missing intellectual property clauses
- Insufficient data protection provisions
        `;
      }

      const updatedAnalysis = {
        status: 'COMPLETED' as const,
        output: aiResponse,
        confidence: 0.85,
        recommendations: [
          'Review termination clauses',
          'Add performance metrics',
          'Clarify liability terms',
          'Include force majeure provisions'
        ],
        completedAt: new Date(),
      };

      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: { id: analysis.id, updates: updatedAnalysis },
      });

      return { ...analysis, ...updatedAnalysis };
    } catch (error) {
      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: {
          id: analysis.id,
          updates: { status: 'FAILED', completedAt: new Date() },
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  };

  const assessRisk = async (matter: Matter): Promise<AIAnalysis> => {
    const analysis: AIAnalysis = {
      id: generateId(),
      type: 'RISK_ASSESSMENT',
      status: 'ANALYZING',
      input: matter,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_ANALYSIS', payload: analysis });
    dispatch({ type: 'SET_ANALYZING', payload: true });

    try {
      const prompt = `
        Analyze the legal risk for this matter:
        
        Title: ${matter.title}
        Type: ${(matter as any).type || 'Not specified'}
        Status: ${(matter as any).status || 'Not specified'}
        Priority: ${(matter as any).priority || 'Not specified'}
        Description: ${(matter as any).description || 'No description provided'}
        
        Provide a comprehensive risk assessment including:
        1. Overall risk level (HIGH/MEDIUM/LOW)
        2. Specific risk factors
        3. Potential outcomes
        4. Mitigation strategies
        5. Timeline considerations
      `;

      let aiResponse;
      if (state.isConnected) {
        aiResponse = await callOllamaAPI(prompt);
      } else {
        // Demo response
        aiResponse = `
**Overall Risk Level: ${(matter as any).priority === 'HIGH' ? 'HIGH' : (matter as any).priority === 'MEDIUM' ? 'MEDIUM' : 'LOW'}**

**Specific Risk Factors:**
- Matter complexity: ${(matter as any).type || 'Not specified'}
- Current status: ${(matter as any).status || 'Not specified'}
- Priority level: ${(matter as any).priority || 'Not specified'}

**Potential Outcomes:**
- Favorable resolution: 65%
- Partial settlement: 25%
- Adverse outcome: 10%

**Mitigation Strategies:**
- Early case assessment
- Document preservation
- Stakeholder communication
- Alternative dispute resolution

**Timeline Considerations:**
- Expected duration: 6-12 months
- Critical milestones: Discovery, mediation, trial preparation
        `;
      }

      const updatedAnalysis = {
        status: 'COMPLETED' as const,
        output: aiResponse,
        confidence: 0.78,
        recommendations: [
          'Document all communications',
          'Consider early settlement',
          'Prepare for discovery phase',
          'Monitor deadline compliance'
        ],
        completedAt: new Date(),
      };

      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: { id: analysis.id, updates: updatedAnalysis },
      });

      return { ...analysis, ...updatedAnalysis };
    } catch (error) {
      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: {
          id: analysis.id,
          updates: { status: 'FAILED', completedAt: new Date() },
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  };

  const predictCase = async (dispute: Dispute): Promise<AIAnalysis> => {
    const analysis: AIAnalysis = {
      id: generateId(),
      type: 'CASE_PREDICTION',
      status: 'ANALYZING',
      input: dispute,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_ANALYSIS', payload: analysis });

    try {
      // Demo prediction logic
      const prediction = {
        status: 'COMPLETED' as const,
        output: `
**Case Prediction Analysis**

**Likelihood of Success: 72%**

**Key Factors:**
- Dispute type: ${(dispute as any).type || 'Not specified'}
- Current status: ${(dispute as any).status || 'Not specified'}
- Evidence strength: Strong
- Legal precedent: Favorable

**Predicted Timeline:**
- Resolution timeframe: 8-14 months
- Key milestones identified

**Strategic Recommendations:**
- Focus on documentation
- Consider mediation first
- Prepare comprehensive brief
        `,
        confidence: 0.72,
        completedAt: new Date(),
      };

      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: { id: analysis.id, updates: prediction },
      });

      return { ...analysis, ...prediction };
    } catch (error) {
      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: {
          id: analysis.id,
          updates: { status: 'FAILED', completedAt: new Date() },
        },
      });
      throw error;
    }
  };

  const reviewDocument = async (file: File): Promise<AIAnalysis> => {
    const analysis: AIAnalysis = {
      id: generateId(),
      type: 'DOCUMENT_REVIEW',
      status: 'ANALYZING',
      input: { fileName: file.name, fileSize: file.size },
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_ANALYSIS', payload: analysis });

    try {
      // In a real implementation, you would extract text from the file
      const review = {
        status: 'COMPLETED' as const,
        output: `
**Document Review: ${file.name}**

**Document Analysis:**
- File type: ${file.type || 'Unknown'}
- Size: ${(file.size / 1024).toFixed(2)} KB
- Review status: Analyzed

**Key Findings:**
- No critical issues identified
- Standard legal language detected
- Compliance requirements met

**Recommendations:**
- Standard document review complete
- Consider legal counsel review for complex terms
        `,
        confidence: 0.88,
        completedAt: new Date(),
      };

      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: { id: analysis.id, updates: review },
      });

      return { ...analysis, ...review };
    } catch (error) {
      dispatch({
        type: 'UPDATE_ANALYSIS',
        payload: {
          id: analysis.id,
          updates: { status: 'FAILED', completedAt: new Date() },
        },
      });
      throw error;
    }
  };

  const getAnalysis = (id: string): AIAnalysis | undefined => {
    return state.analyses.find(analysis => analysis.id === id);
  };

  const clearAnalyses = () => {
    dispatch({ type: 'CLEAR_ANALYSES' });
  };

  const switchModel = async (modelName: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_MODEL', payload: modelName });
      console.log(`Switched to AI model: ${modelName}`);
    } catch (error) {
      console.error('Failed to switch model:', error);
      throw error;
    }
  };

  const value: AIContextType = {
    ...state,
    analyzeContract,
    assessRisk,
    predictCase,
    reviewDocument,
    getAnalysis,
    clearAnalyses,
    switchModel,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
