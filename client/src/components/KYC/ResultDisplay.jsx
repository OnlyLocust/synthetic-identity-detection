import { CheckCircle, XCircle, AlertTriangle, FileText, User, Shield } from 'lucide-react';
import { Card, Badge } from '../Common';
import RiskGauge from '../Dashboard/RiskGauge';
import PipelineStatus from './PipelineStatus';
import { classNames, getRiskLevel, formatDate, maskSSN } from '../../utils/helpers';
import { APPLICATION_STATUS } from '../../utils/constants';

const ResultDisplay = ({ result }) => {
    const {
        applicationId,
        personalInfo,
        decision,
        riskScore,
        stages,
        explanation,
        flags,
        createdAt,
        processedAt,
    } = result;

    const getDecisionDisplay = () => {
        switch (decision) {
            case APPLICATION_STATUS.APPROVED:
                return {
                    icon: CheckCircle,
                    color: 'text-success-500',
                    bgColor: 'bg-success-50',
                    borderColor: 'border-success-200',
                    label: 'APPROVED',
                    message: 'This application has been approved.',
                };
            case APPLICATION_STATUS.REJECTED:
                return {
                    icon: XCircle,
                    color: 'text-danger-500',
                    bgColor: 'bg-danger-50',
                    borderColor: 'border-danger-200',
                    label: 'REJECTED',
                    message: 'This application has been rejected due to high risk indicators.',
                };
            case APPLICATION_STATUS.REVIEW:
                return {
                    icon: AlertTriangle,
                    color: 'text-warning-500',
                    bgColor: 'bg-warning-50',
                    borderColor: 'border-warning-200',
                    label: 'MANUAL REVIEW',
                    message: 'This application requires manual review by an analyst.',
                };
            default:
                return {
                    icon: Shield,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    label: 'PROCESSING',
                    message: 'This application is still being processed.',
                };
        }
    };

    const decisionDisplay = getDecisionDisplay();
    const DecisionIcon = decisionDisplay.icon;
    const riskLevel = getRiskLevel(riskScore);

    return (
        <div className="space-y-6">
            {/* Decision Banner */}
            <div className={classNames(
                'border-2 rounded-xl p-6',
                decisionDisplay.bgColor,
                decisionDisplay.borderColor
            )}>
                <div className="flex items-center gap-4">
                    <div className={classNames(
                        'w-16 h-16 rounded-full flex items-center justify-center',
                        decision === APPLICATION_STATUS.APPROVED ? 'bg-success-100' :
                            decision === APPLICATION_STATUS.REJECTED ? 'bg-danger-100' :
                                decision === APPLICATION_STATUS.REVIEW ? 'bg-warning-100' : 'bg-gray-100'
                    )}>
                        <DecisionIcon size={32} className={decisionDisplay.color} />
                    </div>
                    <div>
                        <h2 className={classNames('text-2xl font-bold', decisionDisplay.color)}>
                            {decisionDisplay.label}
                        </h2>
                        <p className="text-gray-600 mt-1">{decisionDisplay.message}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Score */}
                <Card className="lg:col-span-1">
                    <Card.Header>
                        <Card.Title>Risk Score</Card.Title>
                    </Card.Header>
                    <Card.Content className="flex flex-col items-center">
                        <RiskGauge score={riskScore} size="lg" />
                        <Badge
                            variant={
                                riskScore <= 30 ? 'success' :
                                    riskScore <= 50 ? 'warning' :
                                        riskScore <= 70 ? 'warning' : 'danger'
                            }
                            size="lg"
                            className="mt-4"
                        >
                            {riskLevel.label}
                        </Badge>
                    </Card.Content>
                </Card>

                {/* Pipeline Status */}
                <div className="lg:col-span-2">
                    <PipelineStatus stages={stages} currentStage={-1} />
                </div>
            </div>

            {/* Applicant Info */}
            {personalInfo && (
                <Card>
                    <Card.Header>
                        <Card.Title className="flex items-center gap-2">
                            <User size={20} />
                            Applicant Information
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="font-medium text-gray-900">{personalInfo.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium text-gray-900">{formatDate(personalInfo.dateOfBirth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{personalInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">SSN</p>
                                <p className="font-medium text-gray-900">{maskSSN(personalInfo.ssn)}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium text-gray-900">
                                    {personalInfo.address}, {personalInfo.city}, {personalInfo.state} {personalInfo.zipCode}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{personalInfo.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Country</p>
                                <p className="font-medium text-gray-900">{personalInfo.country}</p>
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            )}

            {/* Explanation & Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {explanation && explanation.length > 0 && (
                    <Card>
                        <Card.Header>
                            <Card.Title className="flex items-center gap-2">
                                <FileText size={20} />
                                Risk Explanation
                            </Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <ul className="space-y-2">
                                {explanation.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card.Content>
                    </Card>
                )}

                {flags && flags.length > 0 && (
                    <Card>
                        <Card.Header>
                            <Card.Title className="flex items-center gap-2 text-warning-600">
                                <AlertTriangle size={20} />
                                Detection Flags
                            </Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <ul className="space-y-2">
                                {flags.map((flag, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                        <AlertTriangle size={14} className="text-warning-500 mt-1 flex-shrink-0" />
                                        {flag}
                                    </li>
                                ))}
                            </ul>
                        </Card.Content>
                    </Card>
                )}
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-sm text-gray-500 px-4">
                <span>Application ID: {applicationId}</span>
                <span>
                    Submitted: {formatDate(createdAt)} | Processed: {formatDate(processedAt)}
                </span>
            </div>
        </div>
    );
};

export default ResultDisplay;
