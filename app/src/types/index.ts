export interface IdentityRecord {
  name: string;
  dob: string;
  email: string;
  phone: string;
  faceAge: number;
  deviceId: string;
  ip: string;
  formTime: number;
  userId: string;
  isSynthetic?: boolean;
}

export interface AnalysisReason {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  // Additional fields based on rule type
  calculatedAge?: number;
  reportedFaceAge?: number;
  variance?: number;
  sharedWith?: string[];
  sharedValue?: string;
  type?: string;
  formTime?: number;
  threshold?: number;
  timeInSeconds?: number;
  sharedIp?: string;
  sharedDeviceId?: string;
  conflictingUserIds?: string[];
  conflictCount?: number;
}

export interface AnalysisResult {
  name: string;
  dob: string;
  email: string;
  phone: string;
  faceAge: number;
  deviceId: string;
  ip: string;
  formTime: number;
  userId: string;
  isSynthetic?: boolean;
  analysis: {
    riskScore: number;
    isSynthetic: boolean;
    reasons: {
      rule: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      details: string;
    }[];
    details: AnalysisReason[];
    analyzedAt: string;
  };
}

export interface AnalysisSummary {
  totalRecords: number;
  syntheticCount: number;
  cleanCount: number;
  averageRiskScore: number;
  rulesTriggered: Record<string, number>;
}

export interface AnalysisResponse {
  success: boolean;
  summary: AnalysisSummary;
  results: AnalysisResult[];
}

export interface SampleData {
  records: IdentityRecord[];
}
