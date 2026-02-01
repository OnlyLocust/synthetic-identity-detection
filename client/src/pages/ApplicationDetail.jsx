import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Loading } from '../components/Common';
import ResultDisplay from '../components/KYC/ResultDisplay';
import kycService from '../services/kycService';
import toast from 'react-hot-toast';

const ApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplication();
    }, [id]);

    const fetchApplication = async () => {
        try {
            setLoading(true);
            const result = await kycService.getResult(id);
            setApplication(result);
        } catch (error) {
            console.error('Failed to fetch application:', error);
            toast.error('Failed to load application details');

            // Demo data fallback
            setApplication({
                applicationId: id,
                personalInfo: {
                    fullName: 'John Doe',
                    dateOfBirth: '1990-05-15',
                    email: 'john@example.com',
                    phone: '(555) 123-4567',
                    ssn: '123-45-6789',
                    address: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'United States',
                },
                decision: 'approved',
                riskScore: 25,
                stages: [
                    { key: 'data_intake', status: 'pass', score: 95 },
                    { key: 'document_forgery', status: 'pass', score: 88 },
                    { key: 'biometric_verification', status: 'pass', score: 100 },
                    { key: 'behavioral_analysis', status: 'pass', score: 92 },
                    { key: 'data_correlation', status: 'pass', score: 85 },
                    { key: 'ml_risk_scoring', status: 'pass', score: 78 },
                    { key: 'decision_engine', status: 'pass', score: 90 },
                ],
                explanation: [
                    'All identity documents verified successfully',
                    'Biometric liveness check passed with high confidence',
                    'Behavioral patterns consistent with genuine user',
                ],
                flags: [],
                createdAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading application..." />;
    }

    return (
        <div>
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/applications')}
                    icon={ArrowLeft}
                    className="text-gray-600"
                >
                    Back to Applications
                </Button>
            </div>

            {application && <ResultDisplay result={application} />}
        </div>
    );
};

export default ApplicationDetail;
