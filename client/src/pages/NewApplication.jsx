import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, FileText, Camera, ClipboardCheck } from 'lucide-react';
import { Card, Button, Alert } from '../components/Common';
import PersonalInfoForm from '../components/KYC/PersonalInfoForm';
import DocumentUpload from '../components/KYC/DocumentUpload';
import BiometricVerification from '../components/KYC/BiometricVerification';
import BehaviorTracker from '../components/BehaviorTracker/BehaviorTracker';
import { classNames, maskSSN, formatDate } from '../utils/helpers';
import kycService from '../services/kycService';
import toast from 'react-hot-toast';

const STEPS = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Documents', icon: FileText },
    { id: 3, name: 'Biometrics', icon: Camera },
    { id: 4, name: 'Review', icon: ClipboardCheck },
];

const NewApplication = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [applicationId, setApplicationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [personalInfo, setPersonalInfo] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [biometricData, setBiometricData] = useState(null);

    const getBehaviorDataRef = useRef(null);

    const handleBehaviorDataReady = useCallback((getDataFn) => {
        getBehaviorDataRef.current = getDataFn;
    }, []);

    const handlePersonalInfoSubmit = async (data) => {
        setLoading(true);
        try {
            // Start application
            let appId = applicationId;
            if (!appId) {
                // Generate ID client-side
                appId = self.crypto.randomUUID();
                setApplicationId(appId);
            }

            // Get behavior data
            const behaviorData = getBehaviorDataRef.current ? getBehaviorDataRef.current() : null;

            // Submit personal info
            await kycService.submitPersonalInfo(appId, data, behaviorData);

            setPersonalInfo(data);
            setCurrentStep(2);
            toast.success('Personal information saved');
        } catch (error) {
            console.error('Failed to submit personal info:', error);
            toast.error(error.message || 'Failed to save personal information');
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentComplete = (data) => {
        setDocumentData(data);
        setCurrentStep(3);
        toast.success('Document verified');
    };

    const handleBiometricComplete = (data) => {
        setBiometricData(data);
        setCurrentStep(4);
        toast.success('Biometric verification complete');
    };

    const handleFinalSubmit = async () => {
        if (!applicationId) {
            toast.error('No application ID found');
            return;
        }

        setSubmitting(true);
        try {
            // Submit biometric data
            await kycService.submitBiometric(
                applicationId,
                biometricData.faceImage,
                biometricData.livenessResult
            );

            toast.success('Application submitted successfully!');
            navigate(`/application/${applicationId}`);
        } catch (error) {
            console.error('Failed to submit application:', error);
            toast.error(error.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BehaviorTracker onDataReady={handleBehaviorDataReady}>
            <div className="max-w-4xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={classNames(
                                        'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                                        currentStep > step.id
                                            ? 'bg-success-500 text-white'
                                            : currentStep === step.id
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                    )}>
                                        {currentStep > step.id ? (
                                            <CheckCircle size={24} />
                                        ) : (
                                            <step.icon size={24} />
                                        )}
                                    </div>
                                    <span className={classNames(
                                        'text-sm mt-2 font-medium',
                                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                                    )}>
                                        {step.name}
                                    </span>
                                </div>

                                {idx < STEPS.length - 1 && (
                                    <div className={classNames(
                                        'w-24 h-1 mx-4 rounded',
                                        currentStep > step.id ? 'bg-success-500' : 'bg-gray-200'
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card>
                    {currentStep === 1 && (
                        <>
                            <Card.Header>
                                <Card.Title>Personal Information</Card.Title>
                                <Card.Description>Please fill in your personal details accurately</Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <PersonalInfoForm onSubmit={handlePersonalInfoSubmit} loading={loading} />
                            </Card.Content>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <Card.Header>
                                <Card.Title>Document Upload</Card.Title>
                                <Card.Description>Upload a valid government-issued ID</Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <DocumentUpload onComplete={handleDocumentComplete} applicationId={applicationId} />
                            </Card.Content>
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <Card.Header>
                                <Card.Title>Biometric Verification</Card.Title>
                                <Card.Description>Complete liveness detection to verify your identity</Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <BiometricVerification onComplete={handleBiometricComplete} />
                            </Card.Content>
                        </>
                    )}

                    {currentStep === 4 && (
                        <>
                            <Card.Header>
                                <Card.Title>Review & Submit</Card.Title>
                                <Card.Description>Please review your information before submitting</Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <div className="space-y-6">
                                    {/* Personal Info Summary */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <User size={18} className="text-primary-500" />
                                            Personal Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{personalInfo?.fullName}</span></div>
                                            <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{formatDate(personalInfo?.dateOfBirth)}</span></div>
                                            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{personalInfo?.email}</span></div>
                                            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{personalInfo?.phone}</span></div>
                                            <div><span className="text-gray-500">SSN:</span> <span className="font-medium">{maskSSN(personalInfo?.ssn)}</span></div>
                                            <div><span className="text-gray-500">City:</span> <span className="font-medium">{personalInfo?.city}, {personalInfo?.state}</span></div>
                                        </div>
                                    </div>

                                    {/* Document Summary */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <FileText size={18} className="text-primary-500" />
                                            Document Verification
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className={classNames(
                                                'px-3 py-1.5 rounded-full text-sm font-medium',
                                                documentData?.analysisResult?.forgeryScore <= 40
                                                    ? 'bg-success-100 text-success-700'
                                                    : 'bg-warning-100 text-warning-700'
                                            )}>
                                                Forgery Score: {documentData?.analysisResult?.forgeryScore}%
                                            </div>
                                            <span className="text-sm text-gray-500">{documentData?.file?.name}</span>
                                        </div>
                                    </div>

                                    {/* Biometric Summary */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Camera size={18} className="text-primary-500" />
                                            Biometric Verification
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-success-100 text-success-700">
                                                Liveness Verified
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {biometricData?.livenessResult?.blinkCount} blinks detected
                                            </span>
                                        </div>
                                    </div>

                                    <Alert type="info" title="Important">
                                        By submitting this application, you confirm that all information provided is accurate and authentic.
                                    </Alert>

                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                            Edit Information
                                        </Button>
                                        <Button onClick={handleFinalSubmit} loading={submitting} size="lg">
                                            Submit Application
                                        </Button>
                                    </div>
                                </div>
                            </Card.Content>
                        </>
                    )}
                </Card>
            </div>
        </BehaviorTracker>
    );
};

export default NewApplication;
