import { classNames } from '../../utils/helpers';
import { getStatusColor } from '../../utils/helpers';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    status,
    className = '',
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-primary-100 text-primary-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        danger: 'bg-danger-100 text-danger-800',
        info: 'bg-blue-100 text-blue-800',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    // If status is provided, use status-based colors
    const statusColors = status ? getStatusColor(status) : null;

    return (
        <span
            className={classNames(
                'inline-flex items-center font-medium rounded-full',
                sizes[size],
                statusColors ? `${statusColors.bg} ${statusColors.text}` : variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
