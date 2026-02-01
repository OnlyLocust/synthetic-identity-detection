import { Link } from 'react-router-dom';
import { Shield, CheckCircle, FileSearch, Fingerprint, Brain, ArrowRight, Lock, Zap, Globe } from 'lucide-react';
import { Button } from '../components/Common';

const Landing = () => {
    const features = [
        {
            icon: FileSearch,
            title: 'AI Document Analysis',
            description: 'Deep learning models detect forged, tampered, or AI-generated identity documents with 99% accuracy.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Fingerprint,
            title: 'Live Biometric Check',
            description: 'Real-time liveness detection ensures a real person is present, preventing photo/video spoofing.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: Brain,
            title: 'Behavioral Intelligence',
            description: 'Analyzes typing patterns, mouse movements, and form interactions to detect automated fraud.',
            color: 'from-orange-500 to-red-500',
        },
        {
            icon: Lock,
            title: 'ML Risk Scoring',
            description: 'Advanced machine learning models provide accurate fraud probability scores in real-time.',
            color: 'from-green-500 to-emerald-500',
        },
    ];

    const stats = [
        { value: '99.5%', label: 'Detection Accuracy' },
        { value: '<2s', label: 'Verification Time' },
        { value: '50K+', label: 'Daily Verifications' },
        { value: '0.01%', label: 'False Positive Rate' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 px-6 py-5">
                <nav className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <Shield size={28} className="text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white">KYC Fraud Shield</span>
                            <p className="text-xs text-gray-400">Identity Verification Platform</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard">
                            <Button className="shadow-lg shadow-primary-500/25">
                                Launch Dashboard
                            </Button>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8">
                        <Zap size={16} className="animate-pulse" />
                        Trusted by 500+ Financial Institutions
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
                        Stop Synthetic
                        <br />
                        <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Identity Fraud
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Enterprise-grade KYC verification platform powered by AI. Detect forged documents,
                        verify biometrics, and analyze behavioral patterns to protect your business from synthetic identity fraud.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/dashboard">
                            <Button size="lg" icon={ArrowRight} iconPosition="right" className="shadow-xl shadow-primary-500/30 px-8">
                                Start Verification Now
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center p-6 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                                {stat.value}
                            </p>
                            <p className="text-gray-400 mt-2 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Complete Fraud Detection Suite
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Multi-layered verification system that catches what traditional KYC misses
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-primary-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-3xl p-12 border border-primary-500/20 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="relative text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to Secure Your KYC Process?
                        </h2>
                        <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                            Join hundreds of businesses that trust KYC Fraud Shield to protect against identity fraud.
                        </p>
                        <Link to="/dashboard">
                            <Button size="lg" className="shadow-xl shadow-primary-500/30">
                                Enter Console
                                <ArrowRight size={20} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-800 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2026 KYC Fraud Shield. Built for AI + Cybersecurity Hackathon.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
