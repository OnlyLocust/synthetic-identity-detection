import { classNames } from '../../utils/helpers';
import { ChevronDown } from 'lucide-react';

const Select = ({
    label,
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    options = [],
    placeholder = 'Select an option',
    error,
    helperText,
    disabled = false,
    required = false,
    className = '',
    ...props
}) => {
    return (
        <div className={classNames('w-full', className)}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-danger-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={disabled}
                    required={required}
                    className={classNames(
                        'w-full rounded-lg border bg-white text-gray-900 transition-all duration-200 appearance-none',
                        'focus:outline-none focus:ring-2 focus:border-transparent',
                        'px-4 py-2.5 pr-10',
                        error
                            ? 'border-danger-500 focus:ring-danger-500'
                            : 'border-gray-300 focus:ring-primary-500',
                        disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
                        !value && 'text-gray-400'
                    )}
                    {...props}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option
                            key={typeof option === 'object' ? option.value : option}
                            value={typeof option === 'object' ? option.value : option}
                        >
                            {typeof option === 'object' ? option.label : option}
                        </option>
                    ))}
                </select>

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={18} className="text-gray-400" />
                </div>
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

export default Select;
