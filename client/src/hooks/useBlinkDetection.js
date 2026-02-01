import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { BLINK_CONFIG } from '../utils/constants';
import { generateRandomBlinks } from '../utils/helpers';

export const useBlinkDetection = (webcamRef) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const [blinkCount, setBlinkCount] = useState(0);
    const [requiredBlinks, setRequiredBlinks] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(BLINK_CONFIG.TIMEOUT_SECONDS);
    const [faceDetected, setFaceDetected] = useState(false);
    const [currentEAR, setCurrentEAR] = useState(0);

    const detectionIntervalRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const consecutiveLowEARRef = useRef(0);
    const lastBlinkTimeRef = useRef(0);
    const isBlinkingRef = useRef(false);
    const capturedImageRef = useRef(null);

    const calculateEAR = useCallback((eye) => {
        // EAR = (|P2-P6| + |P3-P5|) / (2 * |P1-P4|)
        const p1 = eye[0];
        const p2 = eye[1];
        const p3 = eye[2];
        const p4 = eye[3];
        const p5 = eye[4];
        const p6 = eye[5];

        const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
        const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
        const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

        if (horizontal === 0) return 0.3;
        return (vertical1 + vertical2) / (2.0 * horizontal);
    }, []);

    const getEyeLandmarks = useCallback((landmarks) => {
        const positions = landmarks.positions;

        // Left eye: indices 36-41
        const leftEye = [
            positions[36], positions[37], positions[38],
            positions[39], positions[40], positions[41]
        ];

        // Right eye: indices 42-47
        const rightEye = [
            positions[42], positions[43], positions[44],
            positions[45], positions[46], positions[47]
        ];

        return { leftEye, rightEye };
    }, []);

    const loadModels = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const MODEL_URL = '/models';

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
            ]);

            setIsLoading(false);
            setIsReady(true);
        } catch (err) {
            console.error('Failed to load face-api models:', err);
            setError('Failed to load face detection models. Please refresh and try again.');
            setIsLoading(false);
        }
    }, []);

    const detectFace = useCallback(async () => {
        if (!webcamRef?.current?.video || !isReady || isVerified) return;

        const video = webcamRef.current.video;

        if (video.readyState !== 4) return;

        try {
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks(true);

            if (detection) {
                setFaceDetected(true);

                const { leftEye, rightEye } = getEyeLandmarks(detection.landmarks);
                const leftEAR = calculateEAR(leftEye);
                const rightEAR = calculateEAR(rightEye);
                const avgEAR = (leftEAR + rightEAR) / 2;

                setCurrentEAR(avgEAR);

                // Blink detection logic
                if (avgEAR < BLINK_CONFIG.EAR_THRESHOLD) {
                    consecutiveLowEARRef.current++;

                    if (consecutiveLowEARRef.current >= BLINK_CONFIG.CONSECUTIVE_FRAMES && !isBlinkingRef.current) {
                        isBlinkingRef.current = true;
                    }
                } else {
                    if (isBlinkingRef.current) {
                        const now = Date.now();
                        const blinkDuration = now - lastBlinkTimeRef.current;

                        // Validate blink timing (150-400ms)
                        if (
                            lastBlinkTimeRef.current === 0 ||
                            (blinkDuration >= BLINK_CONFIG.MIN_BLINK_DURATION &&
                                blinkDuration <= BLINK_CONFIG.MAX_BLINK_DURATION * 3)
                        ) {
                            setBlinkCount(prev => {
                                const newCount = prev + 1;
                                if (newCount >= requiredBlinks && !isVerified) {
                                    // Capture face image on success
                                    capturedImageRef.current = webcamRef.current.getScreenshot();
                                    setIsVerified(true);
                                }
                                return newCount;
                            });
                            lastBlinkTimeRef.current = now;
                        }

                        isBlinkingRef.current = false;
                    }
                    consecutiveLowEARRef.current = 0;
                }
            } else {
                setFaceDetected(false);
            }
        } catch (err) {
            console.error('Face detection error:', err);
        }
    }, [webcamRef, isReady, isVerified, requiredBlinks, calculateEAR, getEyeLandmarks]);

    const startDetection = useCallback(() => {
        const blinks = generateRandomBlinks();
        setRequiredBlinks(blinks);
        setBlinkCount(0);
        setIsVerified(false);
        setTimeRemaining(BLINK_CONFIG.TIMEOUT_SECONDS);
        consecutiveLowEARRef.current = 0;
        lastBlinkTimeRef.current = 0;
        isBlinkingRef.current = false;
        capturedImageRef.current = null;

        // Start face detection interval
        detectionIntervalRef.current = setInterval(() => {
            detectFace();
        }, BLINK_CONFIG.DETECTION_INTERVAL);

        // Start countdown timer
        timerIntervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    stopDetection();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [detectFace]);

    const stopDetection = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stopDetection();
        setBlinkCount(0);
        setIsVerified(false);
        setTimeRemaining(BLINK_CONFIG.TIMEOUT_SECONDS);
        setFaceDetected(false);
        setCurrentEAR(0);
        consecutiveLowEARRef.current = 0;
        lastBlinkTimeRef.current = 0;
        isBlinkingRef.current = false;
        capturedImageRef.current = null;
    }, [stopDetection]);

    const getCapturedImage = useCallback(() => {
        return capturedImageRef.current;
    }, []);

    useEffect(() => {
        loadModels();
        return () => {
            stopDetection();
        };
    }, [loadModels, stopDetection]);

    return {
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
    };
};

export default useBlinkDetection;
