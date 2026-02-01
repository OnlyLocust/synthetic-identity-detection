import { useEffect, useCallback, useRef } from 'react';
import { useBehavior } from '../context/BehaviorContext';
import behaviorService from '../services/behaviorService';

export const useBehaviorTracking = () => {
    const {
        startTracking,
        stopTracking,
        resetData,
        trackMouseMove,
        trackScroll,
        trackKeyDown,
        trackKeyUp,
        trackFieldFocus,
        trackFieldBlur,
        trackNavigation,
        getData,
        isTracking,
    } = useBehavior();

    const lastScrollY = useRef(0);
    const lastScrollTime = useRef(0);
    const lastFocusedField = useRef(null);

    const handleMouseMove = useCallback((e) => {
        trackMouseMove(e.clientX, e.clientY);
    }, [trackMouseMove]);

    const handleScroll = useCallback(() => {
        const now = Date.now();
        const currentY = window.scrollY;
        const direction = currentY > lastScrollY.current ? 'down' : 'up';
        const timeDiff = now - lastScrollTime.current;
        const velocity = timeDiff > 0 ? Math.abs(currentY - lastScrollY.current) / timeDiff : 0;

        trackScroll(direction, velocity);

        lastScrollY.current = currentY;
        lastScrollTime.current = now;
    }, [trackScroll]);

    const handleKeyDown = useCallback((e) => {
        const fieldName = e.target.name || e.target.id || 'unknown';
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            trackKeyDown(fieldName, e.key);
        }
    }, [trackKeyDown]);

    const handleKeyUp = useCallback((e) => {
        const fieldName = e.target.name || e.target.id || 'unknown';
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            trackKeyUp(fieldName, e.key);
        }
    }, [trackKeyUp]);

    const handleFocus = useCallback((e) => {
        const fieldName = e.target.name || e.target.id || 'unknown';
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {

            // Track navigation type
            if (lastFocusedField.current) {
                const navType = e.relatedTarget ? 'tab' : 'click';
                trackNavigation(navType, lastFocusedField.current, fieldName);
            }

            trackFieldFocus(fieldName);
            lastFocusedField.current = fieldName;
        }
    }, [trackFieldFocus, trackNavigation]);

    const handleBlur = useCallback((e) => {
        const fieldName = e.target.name || e.target.id || 'unknown';
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            trackFieldBlur(fieldName);
        }
    }, [trackFieldBlur]);

    const attachListeners = useCallback(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('focusout', handleBlur);
    }, [handleMouseMove, handleScroll, handleKeyDown, handleKeyUp, handleFocus, handleBlur]);

    const detachListeners = useCallback(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
    }, [handleMouseMove, handleScroll, handleKeyDown, handleKeyUp, handleFocus, handleBlur]);

    const start = useCallback(() => {
        startTracking();
        attachListeners();
        lastScrollY.current = window.scrollY;
        lastScrollTime.current = Date.now();
    }, [startTracking, attachListeners]);

    const stop = useCallback(() => {
        stopTracking();
        detachListeners();
    }, [stopTracking, detachListeners]);

    const reset = useCallback(() => {
        resetData();
        lastFocusedField.current = null;
    }, [resetData]);

    const getFormattedData = useCallback(() => {
        const rawData = getData();
        return behaviorService.formatBehaviorData(rawData);
    }, [getData]);

    useEffect(() => {
        return () => {
            detachListeners();
        };
    }, [detachListeners]);

    return {
        start,
        stop,
        reset,
        getData,
        getFormattedData,
        isTracking,
    };
};

export default useBehaviorTracking;
