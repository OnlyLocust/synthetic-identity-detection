import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SentinelForm from '../components/SentinelForm';
import BiometricBridge from '../components/BiometricBridge';
import TrustCertificate from '../components/TrustCertificate';
import axios from 'axios';

const UnifiedDashboard = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<any>(null);
    const [result, setResult] = useState<any>(null);

    // Step 1: Form Submit
    const handleFormSubmit = (data: any) => {
        setFormData(data);
        setStep(1); // Move to Liveness
    };

    // Step 2: Liveness Success
    const handleBiometricSuccess = async (data: any) => {
        setStep(2); // Processing

        // Step 3: Call Aggregator
        try {
            const payload = {
                record: {
                    ...formData,
                    // Add computed fields if needed for legacy engine
                    faceAge: data.visualAge, // Use visual age from biometric step
                    formTime: 5000, // Mock for now or pass actual time from form
                    deviceId: "device_" + Math.random().toString(36).substr(2, 5) // Fingerprint
                },
                behavior: formData.behavior,
                biometric: data
            };

            const response = await axios.post('http://localhost:3001/api/unified', payload);
            setResult(response.data);
            setStep(3); // Show Certificate
        } catch (error) {
            console.error("Aggregation failed", error);
            alert("System Error during Unification.");
            setStep(0);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">

            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">E</div>
                        <span className="font-bold text-lg tracking-tight">Echelon Unified</span>
                    </div>
                    <div className="text-xs font-mono text-slate-500">v2.0.0-ALPHA</div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient mb-4">
                        Identity Trust Platform
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Next-generation synthetic identity detection fusing behavioral biometrics, computer vision, and data correlation.
                    </p>
                </div>

                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">

                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-md mx-auto"
                            >
                                <SentinelForm
                                    onInteract={() => { }}
                                    onSubmit={handleFormSubmit}
                                />
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Biometric Liveness Challenge</h2>
                                    <p className="text-slate-400 text-sm">Please follow the on-screen instructions.</p>
                                </div>
                                <BiometricBridge onSuccess={handleBiometricSuccess} />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-64"
                            >
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-indigo-400 animate-pulse">Aggregating Risk Signals...</h3>
                                <div className="text-xs font-mono text-slate-500 mt-2">
                                    Correlation Engine: ONLINE<br />
                                    Behavioral Tensor: CALCULATING<br />
                                    Age Vector: SYNCED
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && result && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <TrustCertificate
                                    score={result.compositeScore}
                                    details={result.breakdown}
                                />

                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => { setStep(0); setFormData(null); setResult(null); }}
                                        className="text-slate-400 hover:text-indigo-400 text-sm underline underline-offset-4 transition"
                                    >
                                        Process Another Identity
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default UnifiedDashboard;
