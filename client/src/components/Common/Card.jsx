import { classNames } from '../../utils/helpers';

const Card = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
    ...props
}) => {
    const paddingSizes = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            onClick={onClick}
            className={classNames(
                'bg-white rounded-xl shadow-sm border border-gray-100',
                paddingSizes[padding],
                hover && 'transition-all duration-200 hover:shadow-md hover:border-gray-200 cursor-pointer',
                onClick && 'cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = '' }) => (
    <div className={classNames('mb-4', className)}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '' }) => (
    <h3 className={classNames('text-lg font-semibold text-gray-900', className)}>
        {children}
    </h3>
);

const CardDescription = ({ children, className = '' }) => (
    <p className={classNames('text-sm text-gray-500 mt-1', className)}>
        {children}
    </p>
);

const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '' }) => (
    <div className={classNames('mt-4 pt-4 border-t border-gray-100', className)}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
