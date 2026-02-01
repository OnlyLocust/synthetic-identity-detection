export const behaviorService = {
    formatBehaviorData(rawData) {
        const {
            mouseMovements,
            scrollEvents,
            keystrokeTimings,
            fieldFocusEvents,
            navigationPatterns,
            sessionStartTime,
        } = rawData;

        // 3. Behavioral Hook Check: Validate no undefined data
        const validatedEvents = mouseMovements.filter(e => e.x !== undefined && e.y !== undefined);
        if (validatedEvents.length < mouseMovements.length) {
            console.warn(`Dropped ${mouseMovements.length - validatedEvents.length} undefined mouse events`);
        }

        const sessionDuration = Date.now() - sessionStartTime;
        const metrics = this.calculateMetrics(rawData);

        return {
            sessionId: rawData.sessionId || crypto.randomUUID(),
            sessionDuration,
            totalMouseEvents: mouseMovements.length,
            totalScrollEvents: scrollEvents.length,
            totalKeystrokeEvents: Object.values(keystrokeTimings).flat().length,
            mouseMovements: mouseMovements.slice(-500), // Last 500 events
            scrollEvents: scrollEvents.slice(-200),
            keystrokeTimings,
            fieldFocusEvents,
            navigationPatterns,
            metrics,
        };
    },

    calculateMetrics(data) {
        const { mouseMovements, scrollEvents, keystrokeTimings, fieldFocusEvents, navigationPatterns } = data;

        return {
            avgMouseVelocity: this.calculateAverageMouseVelocity(mouseMovements),
            mouseJitter: this.calculateMouseJitter(mouseMovements),
            scrollEntropy: this.calculateScrollEntropy(scrollEvents),
            avgTypingSpeed: this.calculateTypingSpeed(keystrokeTimings),
            keystrokeDwellVariance: this.calculateDwellVariance(keystrokeTimings),
            keystrokeFlightVariance: this.calculateFlightVariance(keystrokeTimings),
            avgCognitiveHesitation: this.calculateCognitiveHesitation(fieldFocusEvents, keystrokeTimings),
            tabToClickRatio: this.calculateTabToClickRatio(navigationPatterns),
            totalFieldsInteracted: fieldFocusEvents.length,
            uniqueFieldsVisited: new Set(fieldFocusEvents.map(f => f.fieldName)).size,
        };
    },

    calculateAverageMouseVelocity(movements) {
        if (movements.length < 2) return 0;

        let totalVelocity = 0;
        let count = 0;

        for (let i = 1; i < movements.length; i++) {
            const prev = movements[i - 1];
            const curr = movements[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const dt = curr.timestamp - prev.timestamp;

            if (dt > 0) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                totalVelocity += distance / dt;
                count++;
            }
        }

        return count > 0 ? totalVelocity / count : 0;
    },

    calculateMouseJitter(movements) {
        if (movements.length < 3) return 0;

        const velocities = [];
        for (let i = 1; i < movements.length; i++) {
            const prev = movements[i - 1];
            const curr = movements[i];
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const dt = curr.timestamp - prev.timestamp;

            if (dt > 0 && dt < 200) { // Only consider small time deltas
                velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
            }
        }

        if (velocities.length < 2) return 0;

        const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;

        return Math.sqrt(variance);
    },

    calculateScrollEntropy(scrollEvents) {
        if (scrollEvents.length < 2) return 0;

        const directions = scrollEvents.map(e => e.direction);
        const directionCounts = { up: 0, down: 0 };

        directions.forEach(d => {
            if (d === 'up') directionCounts.up++;
            else if (d === 'down') directionCounts.down++;
        });

        const total = directions.length;
        let entropy = 0;

        Object.values(directionCounts).forEach(count => {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        });

        return entropy;
    },

    calculateTypingSpeed(keystrokeTimings) {
        let totalChars = 0;
        let totalTime = 0;

        Object.values(keystrokeTimings).forEach(fieldStrokes => {
            if (fieldStrokes.length >= 2) {
                totalChars += fieldStrokes.length;
                const fieldTime = fieldStrokes[fieldStrokes.length - 1].keyUp - fieldStrokes[0].keyDown;
                totalTime += fieldTime;
            }
        });

        if (totalTime === 0) return 0;

        // Characters per minute
        return (totalChars / totalTime) * 60000;
    },

    calculateDwellVariance(keystrokeTimings) {
        const dwellTimes = [];

        Object.values(keystrokeTimings).forEach(fieldStrokes => {
            fieldStrokes.forEach(stroke => {
                if (stroke.keyUp && stroke.keyDown) {
                    dwellTimes.push(stroke.keyUp - stroke.keyDown);
                }
            });
        });

        if (dwellTimes.length < 2) return 0;

        const mean = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
        const variance = dwellTimes.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / dwellTimes.length;

        return variance;
    },

    calculateFlightVariance(keystrokeTimings) {
        const flightTimes = [];

        Object.values(keystrokeTimings).forEach(fieldStrokes => {
            for (let i = 1; i < fieldStrokes.length; i++) {
                const flight = fieldStrokes[i].keyDown - fieldStrokes[i - 1].keyUp;
                if (flight > 0 && flight < 2000) { // Filter reasonable flight times
                    flightTimes.push(flight);
                }
            }
        });

        if (flightTimes.length < 2) return 0;

        const mean = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length;
        const variance = flightTimes.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / flightTimes.length;

        return variance;
    },

    calculateCognitiveHesitation(fieldFocusEvents, keystrokeTimings) {
        const hesitations = [];

        fieldFocusEvents.forEach(focus => {
            const fieldStrokes = keystrokeTimings[focus.fieldName];
            if (fieldStrokes && fieldStrokes.length > 0) {
                const firstKeystroke = fieldStrokes[0].keyDown;
                const hesitation = firstKeystroke - focus.focusTime;
                if (hesitation > 0 && hesitation < 30000) { // Filter reasonable hesitation times
                    hesitations.push(hesitation);
                }
            }
        });

        if (hesitations.length === 0) return 0;

        return hesitations.reduce((a, b) => a + b, 0) / hesitations.length;
    },

    calculateTabToClickRatio(navigationPatterns) {
        let tabCount = 0;
        let clickCount = 0;

        navigationPatterns.forEach(nav => {
            if (nav.type === 'tab') tabCount++;
            else if (nav.type === 'click') clickCount++;
        });

        const total = tabCount + clickCount;
        if (total === 0) return 0;

        return tabCount / total;
    },
};

export default behaviorService;
