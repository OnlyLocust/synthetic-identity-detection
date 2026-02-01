import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/Common';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        const result = await login(formData);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/25">
                            <Shield size={36} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">KYC Fraud Shield</h1>
                            <p className="text-gray-400">Identity Verification Platform</p>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        Protect Your Business from
                        <span className="block bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                            Synthetic Identity Fraud
                        </span>
                    </h2>

                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        Advanced AI-powered verification system that detects forged documents,
                        verifies biometrics, and analyzes behavioral patterns in real-time.
                    </p>

                    <div className="space-y-4">
                        {['Document Forgery Detection', 'Live Biometric Verification', 'Behavioral Analysis'].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-gray-300">
                                <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">KYC Fraud Shield</h1>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                icon={Mail}
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Lock}
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                                    <span className="text-gray-600">Remember me</span>
                                </label>
                                <a href="#" className="text-primary-500 hover:text-primary-600 font-medium">
                                    Forgot password?
                                </a>
                            </div>

                            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-6">
                                Sign In
                                <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        <Link to="/" className="hover:text-gray-600 flex items-center justify-center gap-2">
                            ← Back to Home
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
