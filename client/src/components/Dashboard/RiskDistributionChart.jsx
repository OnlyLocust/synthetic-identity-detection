import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card } from '../Common';

ChartJS.register(ArcElement, Tooltip, Legend);

const RiskDistributionChart = ({ data }) => {
    const chartData = {
        labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
        datasets: [
            {
                data: [
                    data?.low || 0,
                    data?.medium || 0,
                    data?.high || 0,
                    data?.critical || 0,
                ],
                backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
                borderColor: ['#059669', '#D97706', '#EA580C', '#DC2626'],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, usePointStyle: true },
            },
        },
    };

    const total = (data?.low || 0) + (data?.medium || 0) + (data?.high || 0) + (data?.critical || 0);

    return (
        <Card>
            <Card.Header>
                <Card.Title>Risk Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
                {total > 0 ? (
                    <div className="h-64">
                        <Pie data={chartData} options={options} />
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        No data available
                    </div>
                )}
            </Card.Content>
        </Card>
    );
};

export default RiskDistributionChart;
