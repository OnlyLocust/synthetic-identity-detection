import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ScanFace } from 'lucide-react';
import axios from 'axios';

interface BiometricBridgeProps {
    onSuccess: (data: { visualAge: number; livenessVerified: boolean }) => void;
}

const base64ToBlob = (base64: string) => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

const BiometricBridge: React.FC<BiometricBridgeProps> = ({ onSuccess }) => {
    const webcamRef = useRef<Webcam>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [status, setStatus] = useState<string>("WAITING");
    const [challenge, setChallenge] = useState<string>("Initializing...");
    const [timeLeft, setTimeLeft] = useState<number>(10);
    const [verified, setVerified] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Connect WebSocket
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/liveness");

        ws.onopen = () => {
            console.log("Connected to Biometric Server");
            setError(null);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStatus(data.state);
            setChallenge(data.challenge);
            setTimeLeft(data.remaining_time);

            if (data.verified && !verified) {
                setVerified(true);
                handleSuccess();
            }
        };

        ws.onerror = () => {
            setError("Connection to Biometric Server failed. Ensure server is running.");
            setStatus("ERROR");
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    // Frame Loop
    useEffect(() => {
        if (verified || status === "FAILED") return;

        const interval = setInterval(() => {
            if (webcamRef.current && socket && socket.readyState === WebSocket.OPEN) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    socket.send(JSON.stringify({ image: imageSrc }));
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [socket, status, verified]);

    const handleSuccess = useCallback(async () => {
        setIsProcessing(true);

        let visualAge = 0;

        // 1. Try Real Python Age API
        try {
            if (webcamRef.current) {
                const screenshot = webcamRef.current.getScreenshot();
                if (screenshot) {
                    const blob = base64ToBlob(screenshot);
                    const formData = new FormData();
                    formData.append('image', blob, 'capture.jpg');

                    const response = await axios.post('http://localhost:5000/detect', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (response.data && response.data.detectAge) {
                        const { startAge, endAge } = response.data.detectAge;
                        visualAge = Math.round((startAge + endAge) / 2);
                        console.log(`Real Age Detected: ${visualAge} (${startAge}-${endAge})`);
                    }
                }
            }
        } catch (err) {
            console.warn("Real Age API (localhost:5000) failed, falling back to Mock/Simulated", err);

            // 2. Fallback to Mock if Real API fails
            try {
                const mockRes = await axios.post('http://localhost:8000/api/age-detect');
                visualAge = mockRes.data.visual_age;
            } catch (mockErr) {
                console.error("All age services failed");
                setError("Liveness Passed, but Age Verification unavailable.");
                setIsProcessing(false);
                return;
            }
        }

        setIsProcessing(false);
        onSuccess({
            visualAge,
            livenessVerified: true
        });

    }, [onSuccess]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/30 bg-black">
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover opacity-80"
                videoConstraints={{ facingMode: "user" }}
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">

                {/* Header */}
                <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ScanFace className="text-indigo-400 animate-pulse" />
                        <span className="text-sm font-mono text-indigo-100 font-bold">BIO-BRIDGE LINKED</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${status === "SUCCESS" ? "bg-green-500/20 text-green-400" :
                        status === "FAILED" ? "bg-red-500/20 text-red-400" :
                            "bg-blue-500/20 text-blue-400"
                        }`}>
                        {status}
                    </div>
                </div>

                {/* Challenge Center */}
                <AnimatePresence>
                    {!verified && status !== "FAILED" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="self-center text-center bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/10"
                        >
                            <h3 className="text-gray-300 text-xs uppercase tracking-widest mb-1">Current Challenge</h3>
                            <div className="text-2xl font-bold text-white mb-2">{challenge}</div>
                            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-indigo-500 h-full"
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${(timeLeft / 10) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{timeLeft.toFixed(1)}s remaining</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success/Error State */}
                {verified && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute inset-0 bg-green-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                        <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Identity Verified</h2>
                        <p className="text-green-200">Liveness confirmed. Integrating biometric age data...</p>
                        {isProcessing && <p className="text-xs text-white/50 mt-4 animate-pulse">Syncing with Mainframe...</p>}
                    </motion.div>
                )}

                {status === "FAILED" && (
                    <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-red-200">Liveness challenge criteria not met.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 rounded-lg text-white text-sm hover:bg-red-700 transition"
                        >
                            Retry Handshake
                        </button>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-xs p-2 text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiometricBridge;
