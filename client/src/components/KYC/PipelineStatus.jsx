import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { KYC_STAGES, STAGE_STATUS } from '../../utils/constants';
import { classNames } from '../../utils/helpers';

const PipelineStatus = ({ stages = [], currentStage = 0 }) => {
    const getStageData = (stageKey) => {
        return stages.find((s) => s.key === stageKey) || { status: STAGE_STATUS.PENDING, score: null };
    };

    const getStatusIcon = (status, isActive) => {
        switch (status) {
            case STAGE_STATUS.PASS:
                return <CheckCircle size={20} className="text-success-500" />;
            case STAGE_STATUS.FAIL:
                return <XCircle size={20} className="text-danger-500" />;
            case STAGE_STATUS.PROCESSING:
                return <Loader2 size={20} className="text-primary-500 animate-spin" />;
            default:
                return <Clock size={20} className={isActive ? 'text-primary-500' : 'text-gray-400'} />;
        }
    };

    const getStatusColor = (status, isActive) => {
        switch (status) {
            case STAGE_STATUS.PASS:
                return 'border-success-500 bg-success-50';
            case STAGE_STATUS.FAIL:
                return 'border-danger-500 bg-danger-50';
            case STAGE_STATUS.PROCESSING:
                return 'border-primary-500 bg-primary-50';
            default:
                return isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50';
        }
    };

    const getConnectorColor = (status) => {
        switch (status) {
            case STAGE_STATUS.PASS:
                return 'bg-success-500';
            case STAGE_STATUS.FAIL:
                return 'bg-danger-500';
            default:
                return 'bg-gray-300';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Status</h3>

            <div className="relative">
                {KYC_STAGES.map((stage, index) => {
                    const stageData = getStageData(stage.key);
                    const isActive = index === currentStage;
                    const isCompleted = stageData.status === STAGE_STATUS.PASS || stageData.status === STAGE_STATUS.FAIL;

                    return (
                        <div key={stage.id} className="relative">
                            {/* Connector Line */}
                            {index < KYC_STAGES.length - 1 && (
                                <div
                                    className={classNames(
                                        'absolute left-5 top-10 w-0.5 h-12',
                                        getConnectorColor(stageData.status)
                                    )}
                                />
                            )}

                            <div className={classNames(
                                'flex items-start gap-4 p-3 rounded-lg transition-all',
                                isActive && 'bg-primary-50'
                            )}>
                                {/* Status Icon */}
                                <div className={classNames(
                                    'w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    getStatusColor(stageData.status, isActive)
                                )}>
                                    {getStatusIcon(stageData.status, isActive)}
                                </div>

                                {/* Stage Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className={classNames(
                                            'font-medium',
                                            isActive ? 'text-primary-700' : 'text-gray-900'
                                        )}>
                                            {stage.name}
                                        </h4>

                                        {stageData.score !== null && stageData.score !== undefined && (
                                            <span className={classNames(
                                                'text-sm font-semibold px-2 py-0.5 rounded',
                                                stageData.status === STAGE_STATUS.PASS
                                                    ? 'bg-success-100 text-success-700'
                                                    : stageData.status === STAGE_STATUS.FAIL
                                                        ? 'bg-danger-100 text-danger-700'
                                                        : 'bg-gray-100 text-gray-700'
                                            )}>
                                                {stageData.score}%
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {stageData.status === STAGE_STATUS.PASS && 'Passed'}
                                        {stageData.status === STAGE_STATUS.FAIL && 'Failed'}
                                        {stageData.status === STAGE_STATUS.PROCESSING && 'Processing...'}
                                        {stageData.status === STAGE_STATUS.PENDING && (
                                            isActive ? 'In Progress' : 'Pending'
                                        )}
                                    </p>

                                    {stageData.message && (
                                        <p className="text-xs text-gray-400 mt-1">{stageData.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PipelineStatus;
