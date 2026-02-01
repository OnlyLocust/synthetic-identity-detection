import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Alert = ({
    type = 'info',
    title,
    children,
    dismissible = false,
    onDismiss,
    className = '',
    ...props
}) => {
    const types = {
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: Info,
            iconColor: 'text-blue-500',
            titleColor: 'text-blue-800',
            textColor: 'text-blue-700',
        },
        success: {
            bg: 'bg-success-50',
            border: 'border-success-200',
            icon: CheckCircle,
            iconColor: 'text-success-500',
            titleColor: 'text-success-800',
            textColor: 'text-success-700',
        },
        warning: {
            bg: 'bg-warning-50',
            border: 'border-warning-200',
            icon: AlertTriangle,
            iconColor: 'text-warning-500',
            titleColor: 'text-warning-800',
            textColor: 'text-warning-700',
        },
        error: {
            bg: 'bg-danger-50',
            border: 'border-danger-200',
            icon: AlertCircle,
            iconColor: 'text-danger-500',
            titleColor: 'text-danger-800',
            textColor: 'text-danger-700',
        },
    };

    const config = types[type];
    const Icon = config.icon;

    return (
        <div
            className={classNames(
                'flex gap-3 p-4 rounded-lg border',
                config.bg,
                config.border,
                className
            )}
            role="alert"
            {...props}
        >
            <Icon size={20} className={classNames('flex-shrink-0 mt-0.5', config.iconColor)} />

            <div className="flex-1">
                {title && (
                    <h4 className={classNames('font-medium mb-1', config.titleColor)}>
                        {title}
                    </h4>
                )}
                <div className={classNames('text-sm', config.textColor)}>
                    {children}
                </div>
            </div>

            {dismissible && (
                <button
                    onClick={onDismiss}
                    className={classNames(
                        'flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors',
                        config.iconColor
                    )}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default Alert;
