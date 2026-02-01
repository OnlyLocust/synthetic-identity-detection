import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { Button, Alert } from '../Common';
import { useBlinkDetection } from '../../hooks/useBlinkDetection';
import { classNames } from '../../utils/helpers';
import { BLINK_CONFIG } from '../../utils/constants';

const BiometricVerification = ({ onComplete }) => {
    const webcamRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [isStarted, setIsStarted] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);

    const {
        isLoading,
        isReady,
        error,
        blinkCount,
        requiredBlinks,
        isVerified,
        timeRemaining,
        faceDetected,
        currentEAR,
        startDetection,
        stopDetection,
        reset,
        getCapturedImage,
    } = useBlinkDetection(webcamRef);

    const handleUserMedia = useCallback(() => {
        setHasPermission(true);
    }, []);

    const handleUserMediaError = useCallback((err) => {
        console.error('Camera access error:', err);
        setHasPermission(false);
    }, []);

    const handleStart = () => {
        setIsStarted(true);
        startDetection();
    };

    const handleRetry = () => {
        reset();
        setCapturedImage(null);
        setIsStarted(false);
    };

    const handleContinue = () => {
        const image = getCapturedImage();
        onComplete({
            faceImage: image || capturedImage,
            livenessResult: {
                passed: isVerified,
                blinkCount: blinkCount,
                requiredBlinks: requiredBlinks,
                timestamp: Date.now(),
            },
        });
    };

    useEffect(() => {
        if (isVerified) {
            const image = getCapturedImage();
            if (image) {
                setCapturedImage(image);
            } else if (webcamRef.current) {
                setCapturedImage(webcamRef.current.getScreenshot());
            }
            stopDetection();
        }
    }, [isVerified, getCapturedImage, stopDetection]);

    useEffect(() => {
        if (timeRemaining === 0 && !isVerified && isStarted) {
            stopDetection();
        }
    }, [timeRemaining, isVerified, isStarted, stopDetection]);

    const videoConstraints = {
        width: 640,
        height: 480,
        facingMode: 'user',
    };

    // Loading models
    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading face detection models...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
            </div>
        );
    }

    // Model loading error
    if (error && !isReady) {
        return (
            <Alert type="error" title="Initialization Error">
                {error}
                <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-3">
                    Refresh Page
                </Button>
            </Alert>
        );
    }

    // Camera permission denied
    if (hasPermission === false) {
        return (
            <Alert type="error" title="Camera Access Required">
                <p>Please allow camera access to complete biometric verification.</p>
                <p className="text-sm mt-2">Check your browser settings and reload the page.</p>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Camera View */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video max-w-2xl mx-auto">
                {!isVerified ? (
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={handleUserMediaError}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    capturedImage && (
                        <img
                            src={capturedImage}
                            alt="Captured face"
                            className="w-full h-full object-cover"
                        />
                    )
                )}

                {/* Overlay UI */}
                {isStarted && !isVerified && (
                    <>
                        {/* Face detection indicator */}
                        <div className={classNames(
                            'absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2',
                            faceDetected
                                ? 'bg-success-500/90 text-white'
                                : 'bg-danger-500/90 text-white'
                        )}>
                            {faceDetected ? (
                                <>
                                    <CheckCircle size={16} />
                                    Face Detected
                                </>
                            ) : (
                                <>
                                    <XCircle size={16} />
                                    No Face Detected
                                </>
                            )}
                        </div>

                        {/* Timer */}
                        <div className={classNames(
                            'absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-bold',
                            timeRemaining <= 5 ? 'bg-danger-500 text-white' : 'bg-white/90 text-gray-900'
                        )}>
                            {timeRemaining}s
                        </div>

                        {/* Blink counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4">
                            <Eye size={24} className="text-primary-500" />
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">
                                    {blinkCount} / {requiredBlinks}
                                </p>
                                <p className="text-xs text-gray-500">Blinks Detected</p>
                            </div>
                        </div>

                        {/* Face guide overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={classNames(
                                'w-48 h-64 border-4 rounded-full transition-colors',
                                faceDetected ? 'border-success-500' : 'border-white/50'
                            )}></div>
                        </div>
                    </>
                )}

                {/* Verification success overlay */}
                {isVerified && (
                    <div className="absolute inset-0 bg-success-500/20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-4">
                            <CheckCircle size={48} className="text-success-500" />
                        </div>
                    </div>
                )}

                {/* Timeout overlay */}
                {timeRemaining === 0 && !isVerified && isStarted && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-center text-white">
                            <XCircle size={48} className="mx-auto mb-3" />
                            <p className="text-lg font-semibold">Verification Timed Out</p>
                            <p className="text-sm text-gray-300 mt-1">Please try again</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            {!isStarted && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 max-w-2xl mx-auto">
                    <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                        <Camera size={20} />
                        Liveness Verification Instructions
                    </h4>
                    <ul className="space-y-2 text-primary-800">
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <span>Position your face within the oval guide</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <span>Ensure good lighting on your face</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <span>Blink naturally when prompted ({BLINK_CONFIG.MIN_BLINKS}-{BLINK_CONFIG.MAX_BLINKS} times)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                            <span>Complete within {BLINK_CONFIG.TIMEOUT_SECONDS} seconds</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* Status Message */}
            {isStarted && !isVerified && timeRemaining > 0 && (
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-900">
                        Please blink <span className="text-primary-500 font-bold">{requiredBlinks}</span> times
                    </p>
                    <p className="text-gray-500 mt-1">
                        {faceDetected
                            ? 'Face detected - blink naturally'
                            : 'Please position your face in frame'}
                    </p>
                </div>
            )}

            {/* Success Message */}
            {isVerified && (
                <Alert type="success" title="Liveness Verified!" className="max-w-2xl mx-auto">
                    <p>Successfully detected {blinkCount} blinks. Your identity has been verified.</p>
                </Alert>
            )}

            {/* Failure Message */}
            {timeRemaining === 0 && !isVerified && isStarted && (
                <Alert type="error" title="Verification Failed" className="max-w-2xl mx-auto">
                    <p>Could not complete liveness verification. Only {blinkCount} of {requiredBlinks} blinks detected.</p>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-4">
                    {!isStarted && (
                        <Button onClick={handleStart} size="lg" icon={Camera}>
                            Start Verification
                        </Button>
                    )}

                    {(isVerified || (timeRemaining === 0 && isStarted)) && (
                        <Button onClick={handleRetry} variant="outline" icon={RefreshCw}>
                            Try Again
                        </Button>
                    )}

                    {isVerified && (
                        <Button onClick={handleContinue} size="lg">
                            Continue to Review
                        </Button>
                    )}
                </div>

                {/* Skip for Demo - Only show when verification is not complete */}
                {!isVerified && (
                    <button
                        onClick={() => {
                            onComplete({
                                faceImage: 'demo-skip',
                                livenessResult: {
                                    passed: true,
                                    blinkCount: 3,
                                    requiredBlinks: 3,
                                    timestamp: Date.now(),
                                    skippedForDemo: true,
                                },
                            });
                        }}
                        className="text-sm text-gray-400 hover:text-gray-600 underline"
                    >
                        Skip for Demo (Testing Only)
                    </button>
                )}
            </div>
        </div>
    );
};

export default BiometricVerification;
