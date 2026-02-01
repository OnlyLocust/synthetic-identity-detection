import { FileCheck, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '../Common';
import { classNames } from '../../utils/helpers';

const StatsCards = ({ stats }) => {
    const cards = [
        {
            title: 'Total Applications',
            value: stats?.total || 0,
            icon: FileCheck,
            color: 'primary',
            bgColor: 'bg-primary-50',
            iconColor: 'text-primary-500',
        },
        {
            title: 'Approved',
            value: stats?.approved || 0,
            icon: CheckCircle,
            color: 'success',
            bgColor: 'bg-success-50',
            iconColor: 'text-success-500',
            change: stats?.approvedChange,
        },
        {
            title: 'Rejected',
            value: stats?.rejected || 0,
            icon: XCircle,
            color: 'danger',
            bgColor: 'bg-danger-50',
            iconColor: 'text-danger-500',
            change: stats?.rejectedChange,
        },
        {
            title: 'Pending Review',
            value: stats?.pendingReview || 0,
            icon: Clock,
            color: 'warning',
            bgColor: 'bg-warning-50',
            iconColor: 'text-warning-500',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
                <Card key={card.title} className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.title}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                            {card.change !== undefined && (
                                <p className={classNames(
                                    'text-sm mt-2 flex items-center gap-1',
                                    card.change >= 0 ? 'text-success-600' : 'text-danger-600'
                                )}>
                                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change)}% vs last week
                                </p>
                            )}
                        </div>
                        <div className={classNames('w-12 h-12 rounded-lg flex items-center justify-center', card.bgColor)}>
                            <card.icon size={24} className={card.iconColor} />
                        </div>
                    </div>

                    {/* Decorative element */}
                    <div className={classNames(
                        'absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10',
                        card.bgColor.replace('50', '500')
                    )}></div>
                </Card>
            ))}
        </div>
    );
};

export default StatsCards;
