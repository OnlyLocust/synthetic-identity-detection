import { useEffect } from 'react';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';

const BehaviorTracker = ({ children, onDataReady }) => {
    const { start, stop, getFormattedData, isTracking } = useBehaviorTracking();

    useEffect(() => {
        start();
        return () => {
            stop();
        };
    }, [start, stop]);

    useEffect(() => {
        if (onDataReady) {
            onDataReady(getFormattedData);
        }
    }, [onDataReady, getFormattedData]);

    return <>{children}</>;
};

export default BehaviorTracker;
