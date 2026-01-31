import { 
  ArrowLeft, 
  AlertTriangle, 
  ShieldAlert,
  Calendar,
  User,
  Mail,
  Phone,
  Cpu,
  Globe,
  Clock,
  Fingerprint,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import type { AnalysisResponse } from '@/types';
import { cn } from '@/lib/utils';

interface DetailViewProps {
  record: AnalysisResponse['results'][0];
  onBack: () => void;
}

export function DetailView({ record, onBack }: DetailViewProps) {
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800';
      default: return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const calculatedAge = calculateAge(record.dob);
  const ageVariance = Math.abs(calculatedAge - record.faceAge);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-slate-400" />
              <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {record.userId}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className={cn(
          "mb-6 p-4 rounded-lg border flex items-center gap-4",
          record.analysis.isSynthetic 
            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" 
            : "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
        )}>
          {record.analysis.isSynthetic ? (
            <>
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                  Synthetic Identity Detected
                </h2>
                <p className="text-sm text-red-600 dark:text-red-400">
                  This record triggered {record.analysis.reasons.length} fraud detection rule(s)
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
                  Clean Identity
                </h2>
                <p className="text-sm text-green-600 dark:text-green-400">
                  No fraud indicators detected
                </p>
              </div>
            </>
          )}
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">Risk Score</div>
              <div className={cn(
                "text-2xl font-bold",
                record.analysis.riskScore >= 70 ? "text-red-600" :
                record.analysis.riskScore >= 40 ? "text-orange-600" :
                "text-green-600"
              )}>
                {record.analysis.riskScore}/100
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Identity Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Identity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Full Name</label>
                  <p className="font-medium">{record.name}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date of Birth
                  </label>
                  <p className="font-medium">{record.dob}</p>
                  <p className="text-sm text-slate-500">
                    Calculated Age: {calculatedAge} years
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Face-Detected Age
                  </label>
                  <p className={cn(
                    "font-medium",
                    ageVariance > 5 && "text-red-600"
                  )}>
                    {record.faceAge} years
                    {ageVariance > 5 && (
                      <span className="text-sm ml-2">
                        (Variance: {ageVariance} years)
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="font-mono text-sm">{record.email}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </label>
                  <p className="font-mono text-sm">{record.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="h-4 w-4" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    Device ID
                  </label>
                  <p className="font-mono text-sm">{record.deviceId}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    IP Address
                  </label>
                  <p className="font-mono text-sm">{record.ip}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Form Completion Time
                  </label>
                  <p className={cn(
                    "font-mono text-sm",
                    record.formTime < 2000 && "text-red-600 font-medium"
                  )}>
                    {formatTime(record.formTime)}
                    {record.formTime < 2000 && (
                      <span className="text-xs ml-2">(Below 2s threshold)</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analysis Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Detection Analysis
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of correlation rules and risk factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {record.analysis.reasons.length > 0 ? (
                  <div className="space-y-4">
                    {record.analysis.details.map((reason, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          getSeverityColor(reason.severity)
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(reason.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{reason.rule}</h4>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs capitalize",
                                  reason.severity === 'critical' && "border-red-300 text-red-700",
                                  reason.severity === 'high' && "border-orange-300 text-orange-700",
                                  reason.severity === 'medium' && "border-yellow-300 text-yellow-700"
                                )}
                              >
                                {reason.severity}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-90">{reason.details}</p>
                            
                            {/* Additional context based on rule type */}
                            {reason.calculatedAge !== undefined && (
                              <div className="mt-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <span className="text-xs opacity-70">DOB Age</span>
                                    <p className="font-mono">{reason.calculatedAge}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs opacity-70">Face Age</span>
                                    <p className="font-mono">{reason.reportedFaceAge}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs opacity-70">Variance</span>
                                    <p className="font-mono font-medium">{reason.variance} years</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {reason.sharedWith && reason.sharedWith.length > 0 && (
                              <div className="mt-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm">
                                <span className="text-xs opacity-70">Also used by:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {reason.sharedWith.map((userId, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs font-mono">
                                      {userId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {reason.timeInSeconds !== undefined && (
                              <div className="mt-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-xs opacity-70">Actual Time</span>
                                    <p className="font-mono">{reason.timeInSeconds}s</p>
                                  </div>
                                  <div>
                                    <span className="text-xs opacity-70">Threshold</span>
                                    <p className="font-mono">2.00s</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {reason.conflictingUserIds && reason.conflictingUserIds.length > 0 && (
                              <div className="mt-3 p-2 bg-white/50 dark:bg-black/20 rounded text-sm">
                                <span className="text-xs opacity-70">Conflicting Identities:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {reason.conflictingUserIds.map((userId, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs font-mono">
                                      {userId}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      No Issues Detected
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      This identity record passed all correlation checks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Overall Risk</span>
                      <span className={cn(
                        "font-medium",
                        record.analysis.riskScore >= 70 ? "text-red-600" :
                        record.analysis.riskScore >= 40 ? "text-orange-600" :
                        "text-green-600"
                      )}>
                        {record.analysis.riskScore}/100
                      </span>
                    </div>
                    <Progress 
                      value={record.analysis.riskScore} 
                      className={cn(
                        "h-2",
                        record.analysis.riskScore >= 70 ? "bg-red-100" :
                        record.analysis.riskScore >= 40 ? "bg-orange-100" :
                        "bg-green-100"
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center pt-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0-39</div>
                      <div className="text-xs text-slate-500">Low Risk</div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">40-69</div>
                      <div className="text-xs text-slate-500">Medium Risk</div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">70-100</div>
                      <div className="text-xs text-slate-500">High Risk</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
