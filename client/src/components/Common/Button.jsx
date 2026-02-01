import { Loader2 } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    onClick,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
        success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm',
        danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-sm',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500 shadow-sm',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500',
        ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
        xl: 'px-8 py-4 text-lg gap-3',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={classNames(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 size={iconSizes[size]} className="animate-spin" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
                </>
            )}
        </button>
    );
};

export default Button;
