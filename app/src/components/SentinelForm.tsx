import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Activity } from 'lucide-react';

interface SentinelFormProps {
    onInteract: (data: any) => void;
    onSubmit: (data: any) => void;
    disabled?: boolean;
}

// Event structure matching backend expectation
interface BehaviorEvent {
    type: 'keydown' | 'keyup' | 'mousemove' | 'scroll' | 'focus' | 'paste';
    timestamp: number;
    fieldId?: string;
    x?: number;
    y?: number;
    depth?: number;
}

const SentinelForm: React.FC<SentinelFormProps> = ({ onInteract, onSubmit, disabled }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        dob: '',
        phone: ''
    });

    const eventsRef = useRef<BehaviorEvent[]>([]);
    const lastScrollDepth = useRef(0);

    const logEvent = (event: BehaviorEvent) => {
        // Keep buffer manageable (e.g. last 1000 events) or full session
        if (eventsRef.current.length > 2000) eventsRef.current.shift();
        eventsRef.current.push(event);
        onInteract(eventsRef.current.length); // Just to verify connection
    };

    // Track Global Window Events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Throttle mouse moves to ~50ms to report
            logEvent({ type: 'mousemove', timestamp: performance.now(), x: e.clientX, y: e.clientY });
        };
        const handleScroll = () => {
            const depth = window.scrollY;
            logEvent({ type: 'scroll', timestamp: performance.now(), depth });
            lastScrollDepth.current = depth;
        };

        // Throttling wrapper
        let moveTimeout: any;
        const throttledMove = (e: MouseEvent) => {
            if (!moveTimeout) {
                moveTimeout = setTimeout(() => {
                    handleMouseMove(e);
                    moveTimeout = null;
                }, 50);
            }
        };

        window.addEventListener('mousemove', throttledMove);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', throttledMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleFieldEvent = (e: any, type: BehaviorEvent['type']) => {
        logEvent({
            type,
            timestamp: performance.now(),
            fieldId: e.target.name
        });
    };

    const handleKeyDown = (e: any) => handleFieldEvent(e, 'keydown');
    const handleKeyUp = (e: any) => handleFieldEvent(e, 'keyup');
    const handleFocus = (e: any) => handleFieldEvent(e, 'focus');
    const handlePaste = (e: any) => handleFieldEvent(e, 'paste');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit both data and the full behavioral event log
        onSubmit({
            ...formData,
            behavior: { events: eventsRef.current }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl"
        >
            <div className="flex items-center space-x-2 mb-6 border-b border-indigo-500/20 pb-4">
                <Activity className="text-indigo-400" size={20} />
                <h2 className="text-lg font-semibold text-slate-100 uppercase tracking-widest">Sentinel Input</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {['name', 'email', 'dob', 'phone'].map((field) => (
                    <div key={field} className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            {field === 'name' && <User size={18} />}
                            {field === 'email' && <Mail size={18} />}
                            {field === 'dob' && <Calendar size={18} />}
                            {field === 'phone' && <Activity size={18} />}
                        </div>
                        <input
                            type={field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'}
                            name={field}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            value={(formData as any)[field]}
                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                            onKeyDown={handleKeyDown}
                            onKeyUp={handleKeyUp}
                            onFocus={handleFocus}
                            onPaste={handlePaste}
                            disabled={disabled}
                            className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 text-sm rounded-lg block pl-10 p-2.5 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                       placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                    </div>
                ))}

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={disabled}
                    className="w-full text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 
                   focus:ring-4 focus:outline-none focus:ring-indigo-800 font-medium rounded-lg text-sm px-5 py-3 text-center
                   disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-indigo-500/20"
                >
                    {disabled ? 'Analyzed' : 'Initiate Verification'}
                </motion.button>
            </form>

            <div className="mt-4 flex justify-between text-[10px] text-slate-600 font-mono">
                <span>EVENTS CAPTURED: {eventsRef.current.length}</span>
                <span>SENTINEL: ON</span>
            </div>
        </motion.div>
    );
};

export default SentinelForm;
