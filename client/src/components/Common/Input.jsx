import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Input = ({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    error,
    helperText,
    disabled = false,
    required = false,
    icon: Icon,
    iconPosition = 'left',
    className = '',
    inputClassName = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={classNames('w-full', className)}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-danger-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {Icon && iconPosition === 'left' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon size={18} className="text-gray-400" />
                    </div>
                )}

                <input
                    id={name}
                    name={name}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={disabled}
                    required={required}
                    className={classNames(
                        'w-full rounded-lg border bg-white text-gray-900 placeholder-gray-400 transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:border-transparent',
                        error
                            ? 'border-danger-500 focus:ring-danger-500'
                            : 'border-gray-300 focus:ring-primary-500',
                        disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
                        Icon && iconPosition === 'left' && 'pl-10',
                        (Icon && iconPosition === 'right') || isPassword ? 'pr-10' : 'pr-4',
                        !Icon || iconPosition === 'right' ? 'pl-4' : '',
                        'py-2.5',
                        inputClassName
                    )}
                    {...props}
                />

                {Icon && iconPosition === 'right' && !isPassword && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Icon size={18} className="text-gray-400" />
                    </div>
                )}

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {(error || helperText) && (
                <p className={classNames(
                    'mt-1.5 text-sm',
                    error ? 'text-danger-500' : 'text-gray-500'
                )}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
