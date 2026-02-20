import { API_BASE_URL } from '../config/api';

export interface Decision {
  decisionId: string;
  timestamp: string;
  agent: string;
  action: string;
  stationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  confidenceScore: number;
  riskScore: number;
  explanation?: string;
  blockchainTx?: string;
  blockNumber?: number;
  auditHash?: string;
  impact: {
    costImpact: number;
    revenueImpact: number;
    successRate: number;
    userSatisfaction: number;
  };
  mlMetrics: {
    confidenceScore: number;
    executionTime: number;
    modelVersion: string;
  };
  auditResults?: {
    anomalyDetected: boolean;
    complianceViolation: boolean;
    auditScore: number;
    riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface DecisionStats {
  totalDecisions: number;
  explanationRate: number;
  blockchainRate: number;
  avgConfidence: number;
  successRate: number;
  complianceRate: number;
}

export interface DecisionFilters {
  agent?: string;
  stationId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  hasExplanation?: boolean;
  hasBlockchain?: boolean;
}

export interface DecisionPagination {
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class DecisionsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/decisions`;
  }

  async getDecisions(
    filters: DecisionFilters = {},
    pagination: DecisionPagination = {}
  ): Promise<ApiResponse<{ decisions: Decision[]; pagination: any; stats: any }>> {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      // Add pagination
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching decisions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getDecisionById(decisionId: string): Promise<ApiResponse<Decision>> {
    try {
      const response = await fetch(`${this.baseUrl}/${decisionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching decision:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getDecisionStats(timeRange: string = '24h'): Promise<ApiResponse<DecisionStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/overview?timeRange=${timeRange}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching decision stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async verifyDecision(decisionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${decisionId}/verify`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying decision:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async regenerateExplanation(decisionId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${decisionId}/regenerate-explanation`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error regenerating explanation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getDecisionsByAgent(agentName: string, limit: number = 100): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/agent/${agentName}?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching decisions by agent:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getFailedDecisions(timeRange: number = 24): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/status/failed?timeRange=${timeRange}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching failed decisions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getHighRiskDecisions(threshold: number = 0.7): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/risk/high?threshold=${threshold}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching high-risk decisions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getPerformanceAnalytics(agentName: string, timeRange: number = 168): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/${agentName}?timeRange=${timeRange}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async logDecision(decisionData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(decisionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging decision:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async logBatchDecisions(decisions: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging batch decisions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

const decisionsService = new DecisionsService();
export default decisionsService;