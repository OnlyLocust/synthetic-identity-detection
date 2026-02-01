import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, ArrowRight, Building2 } from 'lucide-react';
import { Button, Input } from '../components/Common';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
        });

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Form */}
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
                            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                            <p className="text-gray-500 mt-2">Start verifying identities in minutes</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                icon={User}
                            />

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

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                icon={Lock}
                            />

                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                                    <span className="text-sm text-gray-600">
                                        I agree to the <a href="#" className="text-primary-500 hover:underline">Terms of Service</a> and{' '}
                                        <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>
                                    </span>
                                </label>
                            </div>

                            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-4">
                                Create Account
                                <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
                                    Sign in
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

            {/* Right Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
                        Join 500+ Businesses
                        <span className="block bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                            Fighting Fraud Together
                        </span>
                    </h2>

                    <div className="space-y-6 mt-8">
                        {[
                            { icon: Building2, text: 'Enterprise-grade security' },
                            { icon: Shield, text: 'SOC 2 & GDPR compliant' },
                            { icon: ArrowRight, text: 'Setup in under 5 minutes' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 text-gray-300">
                                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                    <item.icon size={20} className="text-primary-400" />
                                </div>
                                <span className="text-lg">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
