import { Loader2 } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Loading = ({
    size = 'md',
    text = 'Loading...',
    fullScreen = false,
    overlay = false,
    className = '',
}) => {
    const sizes = {
        sm: { icon: 16, text: 'text-sm' },
        md: { icon: 24, text: 'text-base' },
        lg: { icon: 32, text: 'text-lg' },
        xl: { icon: 48, text: 'text-xl' },
    };

    const content = (
        <div className={classNames(
            'flex flex-col items-center justify-center gap-3',
            className
        )}>
            <Loader2
                size={sizes[size].icon}
                className="animate-spin text-primary-500"
            />
            {text && (
                <p className={classNames('text-gray-600', sizes[size].text)}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
                {content}
            </div>
        );
    }

    if (overlay) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
                {content}
            </div>
        );
    }

    return content;
};

const LoadingSpinner = ({ size = 20, className = '' }) => (
    <Loader2
        size={size}
        className={classNames('animate-spin text-primary-500', className)}
    />
);

const LoadingDots = ({ className = '' }) => (
    <div className={classNames('flex items-center gap-1', className)}>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
);

const LoadingSkeleton = ({ width = '100%', height = '20px', className = '' }) => (
    <div
        className={classNames('bg-gray-200 rounded animate-pulse', className)}
        style={{ width, height }}
    />
);

Loading.Spinner = LoadingSpinner;
Loading.Dots = LoadingDots;
Loading.Skeleton = LoadingSkeleton;

export default Loading;
