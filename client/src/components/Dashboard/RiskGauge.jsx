import { useMemo } from 'react';
import { getRiskLevel, classNames } from '../../utils/helpers';

const RiskGauge = ({ score = 0, size = 'md' }) => {
    const riskLevel = useMemo(() => getRiskLevel(score), [score]);

    const sizes = {
        sm: { width: 120, strokeWidth: 8, fontSize: 'text-xl' },
        md: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
        lg: { width: 200, strokeWidth: 12, fontSize: 'text-4xl' },
    };

    const config = sizes[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = radius * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: config.width, height: config.width / 2 + 20 }}>
                <svg
                    width={config.width}
                    height={config.width / 2 + 10}
                    className="transform -rotate-0"
                >
                    {/* Background arc */}
                    <path
                        d={`M ${config.strokeWidth / 2} ${config.width / 2} 
                A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                    />
                    {/* Progress arc */}
                    <path
                        d={`M ${config.strokeWidth / 2} ${config.width / 2} 
                A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
                        fill="none"
                        stroke={riskLevel.color}
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500"
                    />
                </svg>

                {/* Score display */}
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <span className={classNames('font-bold', config.fontSize)} style={{ color: riskLevel.color }}>
                        {score}
                    </span>
                </div>
            </div>

            {/* Label */}
            <p className="text-sm text-gray-500 mt-1">{riskLevel.label}</p>
        </div>
    );
};

export default RiskGauge;
