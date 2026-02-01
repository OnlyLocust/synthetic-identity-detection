import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BEHAVIOR_CONFIG } from '../utils/constants';

const BehaviorContext = createContext(null);

export const BehaviorProvider = ({ children }) => {
    const [mouseMovements, setMouseMovements] = useState([]);
    const [scrollEvents, setScrollEvents] = useState([]);
    const [keystrokeTimings, setKeystrokeTimings] = useState({});
    const [fieldFocusEvents, setFieldFocusEvents] = useState([]);
    const [navigationPatterns, setNavigationPatterns] = useState([]);
    const [isTracking, setIsTracking] = useState(false);

    const sessionStartTimeRef = useRef(null);
    const sessionIdRef = useRef(null);
    const lastMouseTimeRef = useRef(0);
    const currentFieldRef = useRef(null);
    const pendingKeystrokeRef = useRef({});

    const startTracking = useCallback(() => {
        sessionStartTimeRef.current = Date.now();
        sessionIdRef.current = crypto.randomUUID();
        setIsTracking(true);
        resetData();
    }, []);

    const stopTracking = useCallback(() => {
        setIsTracking(false);
    }, []);

    const resetData = useCallback(() => {
        setMouseMovements([]);
        setScrollEvents([]);
        setKeystrokeTimings({});
        setFieldFocusEvents([]);
        setNavigationPatterns([]);
        pendingKeystrokeRef.current = {};
        currentFieldRef.current = null;
    }, []);

    const trackMouseMove = useCallback((x, y) => {
        if (!isTracking) return;

        const now = Date.now();
        if (now - lastMouseTimeRef.current < BEHAVIOR_CONFIG.MOUSE_TRACK_INTERVAL) return;

        lastMouseTimeRef.current = now;

        setMouseMovements(prev => {
            const newMovements = [...prev, { x, y, timestamp: now }];
            if (newMovements.length > BEHAVIOR_CONFIG.MAX_MOUSE_EVENTS) {
                return newMovements.slice(-BEHAVIOR_CONFIG.MAX_MOUSE_EVENTS);
            }
            return newMovements;
        });
    }, [isTracking]);

    const trackScroll = useCallback((direction, velocity) => {
        if (!isTracking) return;

        setScrollEvents(prev => {
            const newEvents = [...prev, { direction, velocity, timestamp: Date.now() }];
            if (newEvents.length > BEHAVIOR_CONFIG.MAX_SCROLL_EVENTS) {
                return newEvents.slice(-BEHAVIOR_CONFIG.MAX_SCROLL_EVENTS);
            }
            return newEvents;
        });
    }, [isTracking]);

    const trackKeyDown = useCallback((fieldName, key) => {
        if (!isTracking) return;

        const now = Date.now();
        const keystrokeId = `${fieldName}-${now}`;

        pendingKeystrokeRef.current[keystrokeId] = {
            fieldName,
            key,
            keyDown: now,
            keyUp: null,
        };
    }, [isTracking]);

    const trackKeyUp = useCallback((fieldName, key) => {
        if (!isTracking) return;

        const now = Date.now();

        // Find matching keydown
        const pendingKeys = Object.entries(pendingKeystrokeRef.current);
        const matchingEntry = pendingKeys.find(
            ([id, data]) => data.fieldName === fieldName && data.key === key && !data.keyUp
        );

        if (matchingEntry) {
            const [keystrokeId, data] = matchingEntry;
            data.keyUp = now;

            setKeystrokeTimings(prev => {
                const fieldTimings = prev[fieldName] || [];
                return {
                    ...prev,
                    [fieldName]: [...fieldTimings, { keyDown: data.keyDown, keyUp: now, key }],
                };
            });

            delete pendingKeystrokeRef.current[keystrokeId];
        }
    }, [isTracking]);

    const trackFieldFocus = useCallback((fieldName) => {
        if (!isTracking) return;

        currentFieldRef.current = fieldName;
        setFieldFocusEvents(prev => [
            ...prev,
            { fieldName, focusTime: Date.now() },
        ]);
    }, [isTracking]);

    const trackFieldBlur = useCallback((fieldName) => {
        if (!isTracking) return;

        if (currentFieldRef.current === fieldName) {
            currentFieldRef.current = null;
        }
    }, [isTracking]);

    const trackNavigation = useCallback((type, fromField, toField) => {
        if (!isTracking) return;

        setNavigationPatterns(prev => [
            ...prev,
            { type, fromField, toField, timestamp: Date.now() },
        ]);
    }, [isTracking]);

    const getData = useCallback(() => {
        return {
            sessionId: sessionIdRef.current,
            sessionStartTime: sessionStartTimeRef.current,
            mouseMovements,
            scrollEvents,
            keystrokeTimings,
            fieldFocusEvents,
            navigationPatterns,
        };
    }, [mouseMovements, scrollEvents, keystrokeTimings, fieldFocusEvents, navigationPatterns]);

    const value = {
        mouseMovements,
        scrollEvents,
        keystrokeTimings,
        fieldFocusEvents,
        navigationPatterns,
        isTracking,
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
    };

    return (
        <BehaviorContext.Provider value={value}>
            {children}
        </BehaviorContext.Provider>
    );
};

export const useBehavior = () => {
    const context = useContext(BehaviorContext);
    if (!context) {
        throw new Error('useBehavior must be used within a BehaviorProvider');
    }
    return context;
};

export default BehaviorContext;
