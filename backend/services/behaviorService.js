const { std } = require('mathjs');

const FIELD_SEQUENCE = ['name', 'email', 'phone', 'dob']; // Adjusted to match SentinelForm fields
const PII_FIELDS = ['name', 'phone', 'email'];

const analyzeBehavior = (events) => {
    const flags = [];
    let behaviorScore = 1.0;
    let riskWeight = 0;

    if (!events || events.length === 0) return { behaviorScore: 0, syntheticRiskScore: 0, flags: [] };

    // 1. Typing Rhythm Analysis
    const rhythms = analyzeTypingRhythm(events);
    if (rhythms.isBot) {
        flags.push('Bot_Rhythm');
        behaviorScore -= 0.4;
        riskWeight += 30;
    } else if (rhythms.isInconsistent) {
        flags.push('Inconsistent_Rhythm');
        behaviorScore -= 0.1;
        riskWeight += 10;
    }

    // 2. Navigation Flow Analysis
    const navigation = analyzeNavigation(events);
    if (navigation.isSuspicious) {
        flags.push('Bot_Navigation');
        behaviorScore -= 0.3;
        riskWeight += 20;
    }

    // 3. Paste Detection
    const pastes = detectPastes(events);
    if (pastes.hasPIIPaste) {
        flags.push('PII_Paste_Detected');
        behaviorScore -= 0.2;
        riskWeight += 15;
    }

    // 4. Mouse Trajectory Analysis
    const mouse = analyzeMouseTrajectory(events);
    if (mouse.isBotTrajectory) {
        flags.push('BOT_TRAJECTORY');
        behaviorScore -= 0.3;
        riskWeight += 25;
    }

    // 5. Scroll Entropy Analysis
    const scroll = analyzeScrollEntropy(events);
    if (scroll.isAutomatedScroll) {
        flags.push('AUTOMATED_SCROLL');
        behaviorScore -= 0.2;
        riskWeight += 20;
    }

    // 6. Cognitive Hesitation Analysis
    const hesitation = analyzeCognitiveHesitation(events);
    if (hesitation.isPreProgrammed) {
        flags.push('PRE_PROGRAMMED_INPUT');
        behaviorScore -= 0.4;
        riskWeight += 30;
    }

    const syntheticRiskScore = Math.min(100, riskWeight);

    return {
        behaviorScore: Math.max(0, behaviorScore).toFixed(2),
        syntheticRiskScore,
        flags,
        details: {
            rhythms,
            navigation,
            pastes,
            mouse,
            scroll,
            hesitation
        }
    };
};

const analyzeTypingRhythm = (events) => {
    const keyEvents = events.filter(e => e.type === 'keydown' || e.type === 'keyup');
    if (keyEvents.length < 4) return { isBot: false, isInconsistent: false };

    const dwells = [];
    const flights = [];
    const downTimes = {};

    for (let i = 0; i < keyEvents.length; i++) {
        const e = keyEvents[i];
        if (e.type === 'keydown') {
            downTimes[e.fieldId] = e.timestamp;
            if (i > 0 && keyEvents[i - 1].type === 'keydown') { // flight is between keydowns usually
                // flight logic varies, but let's stick to keydown-to-keydown
                flights.push(e.timestamp - keyEvents[i - 1].timestamp);
            }
        } else if (e.type === 'keyup' && downTimes[e.fieldId]) {
            dwells.push(e.timestamp - downTimes[e.fieldId]);
            delete downTimes[e.fieldId];
        }
    }

    if (dwells.length < 2) return { isBot: false, isInconsistent: false };

    const dwellStd = std(dwells);
    const flightStd = flights.length > 1 ? std(flights) : 100;

    // If variance is near zero, it's likely a bot
    const isBot = dwellStd < 5 || flightStd < 5;
    const isInconsistent = dwellStd > 200 || flightStd > 300;

    return { dwellStd, flightStd, isBot, isInconsistent };
};

const analyzeNavigation = (events) => {
    const fieldVisits = events
        .filter(e => e.fieldId && e.type === 'focus')
        .reduce((acc, e) => {
            if (acc.length === 0 || acc[acc.length - 1] !== e.fieldId) {
                acc.push(e.fieldId);
            }
            return acc;
        }, []);

    let isSuspicious = false;
    for (let i = 1; i < fieldVisits.length; i++) {
        const prevIdx = FIELD_SEQUENCE.indexOf(fieldVisits[i - 1]);
        const currIdx = FIELD_SEQUENCE.indexOf(fieldVisits[i]);

        // If they skip fields or go backwards in a way that suggests automated filling
        if (currIdx - prevIdx > 1 || currIdx === -1) {
            // isSuspicious = true; // Relaxed for demo as users might jump around
        }
    }

    return { fieldSequence: fieldVisits, isSuspicious };
};

const detectPastes = (events) => {
    const pasteEvents = events.filter(e => e.type === 'paste');
    const hasPIIPaste = pasteEvents.some(e => PII_FIELDS.includes(e.fieldId));
    return { pasteCount: pasteEvents.length, hasPIIPaste };
};

const analyzeMouseTrajectory = (events) => {
    const mouseEvents = events.filter(e => e.type === 'mousemove');
    if (mouseEvents.length < 5) return { isBotTrajectory: false }; // Need more points

    let totalPathLength = 0;
    for (let i = 1; i < mouseEvents.length; i++) {
        const dx = mouseEvents[i].x - mouseEvents[i - 1].x;
        const dy = mouseEvents[i].y - mouseEvents[i - 1].y;
        totalPathLength += Math.sqrt(dx * dx + dy * dy);
    }

    const start = mouseEvents[0];
    const end = mouseEvents[mouseEvents.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const euclideanDistance = Math.sqrt(dx * dx + dy * dy);

    const straightnessRatio = totalPathLength > 0 ? euclideanDistance / totalPathLength : 1;
    // Bots move in straight lines (ratio ~ 1.0)
    const isBotTrajectory = straightnessRatio > 0.99 && mouseEvents.length > 10;

    return { straightnessRatio, isBotTrajectory, eventCount: mouseEvents.length };
};

const analyzeScrollEntropy = (events) => {
    const scrollEvents = events.filter(e => e.type === 'scroll');
    if (scrollEvents.length < 2) return { isAutomatedScroll: false };

    const startTime = scrollEvents[0].timestamp;
    const endTime = scrollEvents[scrollEvents.length - 1].timestamp;
    const duration = (endTime - startTime) / 1000; // seconds

    const maxScroll = Math.max(...scrollEvents.map(e => e.depth || 0));
    const reachesBottomFast = duration < 0.5 && maxScroll > 80;

    // Acceleration check
    let zeroAcceleration = true;
    if (scrollEvents.length > 5) {
        let prevVelocity = null;
        for (let i = 1; i < scrollEvents.length; i++) {
            const dt = scrollEvents[i].timestamp - scrollEvents[i - 1].timestamp;
            const dd = (scrollEvents[i].depth || 0) - (scrollEvents[i - 1].depth || 0);
            const velocity = dt > 0 ? dd / dt : 0;

            if (prevVelocity !== null && Math.abs(velocity - prevVelocity) > 0.01) {
                zeroAcceleration = false;
                break;
            }
            prevVelocity = velocity;
        }
    } else {
        zeroAcceleration = false;
    }

    const isAutomatedScroll = reachesBottomFast || (zeroAcceleration && scrollEvents.length > 10);

    return { duration, maxScroll, zeroAcceleration, isAutomatedScroll };
};

const analyzeCognitiveHesitation = (events) => {
    const focusEvents = events.filter(e => e.type === 'focus');
    const firstKeyDownEvents = [];

    focusEvents.forEach(f => {
        const firstKD = events.find(e => e.type === 'keydown' && e.fieldId === f.fieldId && e.timestamp > f.timestamp);
        if (firstKD) {
            firstKeyDownEvents.push(firstKD.timestamp - f.timestamp);
        }
    });

    if (firstKeyDownEvents.length === 0) return { isPreProgrammed: false };

    const averageHesitation = firstKeyDownEvents.reduce((a, b) => a + b, 0) / firstKeyDownEvents.length;
    // Humans hesitate > 200ms usually. Bots < 50ms.
    const isPreProgrammed = averageHesitation < 50 && firstKeyDownEvents.length >= 2;

    return { averageHesitation, hesitationCount: firstKeyDownEvents.length, isPreProgrammed };
};

module.exports = { analyzeBehavior };
