import type { IdentityRecord, AnalysisResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeRecords = async (
  records: IdentityRecord[]
): Promise<AnalysisResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze records');
  }

  return response.json();
};

export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
};
