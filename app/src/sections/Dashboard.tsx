import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileJson, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Activity,
  Users,
  Clock,
  Cpu,
  Globe,
  Search,
  Loader2,
  Play,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sampleRecords, generateJsonTemplate } from '@/lib/sampleData';
import { analyzeRecords } from '@/services/api';
import type { IdentityRecord, AnalysisResponse } from '@/types';
import { ResultsTable } from './ResultsTable';
import { DetailView } from './DetailView';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisResponse['results'][0] | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
        setError(null);
      } catch (err) {
        setError('Failed to read file');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleLoadSample = useCallback(() => {
    setJsonInput(JSON.stringify({ records: sampleRecords }, null, 2));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setJsonInput('');
    setError(null);
    setAnalysisResult(null);
    setSelectedRecord(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let parsed: { records: IdentityRecord[] };
      
      try {
        parsed = JSON.parse(jsonInput);
      } catch {
        throw new Error('Invalid JSON format');
      }

      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('JSON must contain a "records" array');
      }

      const result = await analyzeRecords(parsed.records);
      setAnalysisResult(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  }, [jsonInput]);

  const handleRowClick = useCallback((record: AnalysisResponse['results'][0]) => {
    setSelectedRecord(record);
  }, []);

  const handleBackToResults = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  if (selectedRecord) {
    return (
      <DetailView 
        record={selectedRecord} 
        onBack={handleBackToResults}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Synthetic Identity Detector
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Multi-source data correlation analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult} className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Results
              {analysisResult && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {analysisResult.summary.syntheticCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Identity Records Input
                </CardTitle>
                <CardDescription>
                  Upload or paste JSON data containing identity records for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors">
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Click to upload JSON file
                      </span>
                    </div>
                  </label>
                  <Button
                    variant="outline"
                    onClick={handleLoadSample}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Load Sample
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    disabled={!jsonInput}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* JSON Input */}
                <div className="relative">
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`Paste JSON data here...\n\nFormat:\n${generateJsonTemplate()}`}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !jsonInput.trim()}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Analyze Records
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Detection Rules Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Age Mismatch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Flags when variance between DOB-calculated age and faceAge exceeds ±5 years
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-500" />
                    Identity Clustering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detects same phone, email, or deviceId used across multiple userIds
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-yellow-500" />
                    Behavioral Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Flags form completion times under 2 seconds as potential bot activity
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                    Network Fingerprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Identifies multiple identities sharing the same IP and device combination
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResult && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">
                        Total Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {analysisResult.summary.totalRecords}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn(
                    analysisResult.summary.syntheticCount > 0 && "border-red-200 dark:border-red-800"
                  )}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Synthetic Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {analysisResult.summary.syntheticCount}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Clean Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {analysisResult.summary.cleanCount}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">
                        Average Risk Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={cn(
                        "text-3xl font-bold",
                        analysisResult.summary.averageRiskScore >= 70 ? "text-red-600" :
                        analysisResult.summary.averageRiskScore >= 40 ? "text-orange-600" :
                        "text-green-600"
                      )}>
                        {analysisResult.summary.averageRiskScore}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rules Triggered */}
                {Object.keys(analysisResult.summary.rulesTriggered).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Rules Triggered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(analysisResult.summary.rulesTriggered).map(([rule, count]) => (
                          <Badge 
                            key={rule} 
                            variant={count > 0 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {rule}: {count}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results Table */}
                <ResultsTable 
                  results={analysisResult.results}
                  onRowClick={handleRowClick}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
