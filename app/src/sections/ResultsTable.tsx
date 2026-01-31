import { 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisResponse } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  results: AnalysisResponse['results'];
  onRowClick: (record: AnalysisResponse['results'][0]) => void;
}

export function ResultsTable({ results, onRowClick }: ResultsTableProps) {
  const getRiskBadgeVariant = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'secondary';
    return 'default';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Analysis Results</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-500">Synthetic</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-500">Clean</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Form Time</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((record, index) => (
                <TableRow
                  key={`${record.userId}-${index}`}
                  onClick={() => onRowClick(record)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    record.analysis.isSynthetic 
                      ? "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <TableCell>
                    {record.analysis.isSynthetic ? (
                      <div className="flex items-center justify-center">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {record.userId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {record.email}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {record.phone}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {record.deviceId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {record.ip}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-sm",
                      record.formTime < 2000 && "text-red-600 font-medium"
                    )}>
                      {formatTime(record.formTime)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getRiskBadgeVariant(record.analysis.riskScore)}
                      className="font-mono"
                    >
                      {record.analysis.riskScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {record.analysis.reasons.length > 0 ? (
                        record.analysis.reasons.slice(0, 2).map((reason, idx) => (
                          <Badge 
                            key={idx}
                            variant="outline"
                            className={cn(
                              "text-xs flex items-center gap-1",
                              reason.severity === 'critical' && "border-red-300 text-red-700 dark:text-red-400",
                              reason.severity === 'high' && "border-orange-300 text-orange-700 dark:text-orange-400",
                              reason.severity === 'medium' && "border-yellow-300 text-yellow-700 dark:text-yellow-400"
                            )}
                          >
                            {getSeverityIcon(reason.severity)}
                            {reason.rule.split(' - ')[0]}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                      {record.analysis.reasons.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{record.analysis.reasons.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
