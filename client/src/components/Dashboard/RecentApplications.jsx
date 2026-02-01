import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '../Common';
import { Eye, Trash2 } from 'lucide-react';
import { formatDate, classNames } from '../../utils/helpers';
import toast from 'react-hot-toast';

const RecentApplications = ({ applications = [], onDelete }) => {
    const navigate = useNavigate();
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDelete = (id) => {
        if (onDelete) {
            onDelete(id);
        }
        toast.success('Application deleted');
        setDeleteConfirm(null);
    };

    if (applications.length === 0) {
        return (
            <Card>
                <Card.Header>
                    <Card.Title>Recent Applications</Card.Title>
                </Card.Header>
                <Card.Content>
                    <div className="text-center py-8 text-gray-500">
                        <p>No applications yet</p>
                        <button
                            onClick={() => navigate('/application/new')}
                            className="mt-3 text-primary-500 hover:text-primary-600 font-medium"
                        >
                            Start your first application →
                        </button>
                    </div>
                </Card.Content>
            </Card>
        );
    }

    return (
        <>
            <Card padding="none">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                    <button
                        onClick={() => navigate('/applications')}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                        View all →
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {applications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{app.name || app.personalInfo?.fullName || 'N/A'}</p>
                                        <p className="text-sm text-gray-500">{app.email || app.personalInfo?.email || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(app.createdAt)}</td>
                                    <td className="px-6 py-4">
                                        <Badge status={app.status}>{app.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.riskScore !== null && app.riskScore !== undefined ? (
                                            <span className={classNames(
                                                'font-semibold',
                                                app.riskScore <= 30 ? 'text-success-500' :
                                                    app.riskScore <= 50 ? 'text-warning-500' :
                                                        app.riskScore <= 70 ? 'text-orange-500' : 'text-danger-500'
                                            )}>
                                                {app.riskScore}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/application/${app.id}`)}
                                                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(app.id)}
                                                className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                                title="Delete Application"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Application?</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete this application? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleDelete(deleteConfirm)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RecentApplications;
