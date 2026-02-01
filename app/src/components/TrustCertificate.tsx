import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Fingerprint, Activity, Clock } from 'lucide-react';

interface TrustCertificateProps {
    score: number;
    details: {
        identityScore: number;
        behaviorScore: number;
        ageMatchScore: number;
        isSynthetic: boolean;
    };
}

const TrustCertificate: React.FC<TrustCertificateProps> = ({ score, details }) => {
    const isSafe = score < 50;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
        >
            {/* Decorative gradient */}
            <div className={`absolute top-0 left-0 w-full h-2 ${isSafe ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`} />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#9333EA]/10 rounded-full blur-3xl" />

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h2 className="text-sm font-mono text-slate-400 uppercase tracking-[0.2em] mb-1">Echelon Prime</h2>
                    <h1 className="text-2xl font-bold text-white">Trust Certificate</h1>
                </div>
                <div className="text-right">
                    <div className={`text-4xl font-black ${isSafe ? 'text-emerald-400' : 'text-red-500'}`}>
                        {details.isSynthetic ? 'SYNTHETIC' : 'VERIFIED'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                        ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                <ScoreCard icon={<Fingerprint />} label="Identity Integrity" value={details.identityScore} inverse />
                <ScoreCard icon={<Activity />} label="Behavioral Trust" value={details.behaviorScore} />
                <ScoreCard icon={<Clock />} label="Age Consistency" value={details.ageMatchScore} />
            </div>

            <div className="border-t border-white/10 pt-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    {isSafe ? <ShieldCheck className="text-emerald-400" size={32} /> : <ShieldAlert className="text-red-500" size={32} />}
                    <div>
                        <div className="text-xs text-slate-400 uppercase">Composite Risk Score</div>
                        <div className="text-xl font-bold text-white">{score}/100</div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 max-w-[200px]">
                        {isSafe
                            ? "Identity asserted with high confidence. No significant anomalies detected."
                            : "Identity patterns suggest synthetic fabrication. Manual review recommended."
                        }
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const ScoreCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number; inverse?: boolean }) => {
    const isGood = value < 30;
    return (
        <div className="bg-black/30 p-4 rounded-xl border border-white/10 backdrop-blur">
            <div className={`mb-2 ${isGood ? 'text-[#6366F1]' : 'text-orange-400'}`}>{icon}</div>
            <div className="text-xs text-slate-500 uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold text-slate-200">{value}% <span className="text-[10px] text-slate-600">RISK</span></div>
            <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                <div className={`h-full ${isGood ? 'bg-[#6366F1]' : 'bg-orange-500'}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
};

export default TrustCertificate;
