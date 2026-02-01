import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Alert } from '../Common';
import { validateFile, formatFileSize, classNames } from '../../utils/helpers';
import { DOCUMENT_CONFIG } from '../../utils/constants';
import kycService from '../../services/kycService';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onComplete, applicationId }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFile = useCallback((selectedFile) => {
        setError(null);
        setAnalysisResult(null);

        const validation = validateFile(selectedFile);
        if (!validation.valid) {
            setError(validation.errors.join(', '));
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        setAnalysisResult(null);
        setError(null);
    };

    const analyzeDocument = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // First upload to backend
            if (applicationId) {
                await kycService.uploadDocument(applicationId, file);
            }

            // Then analyze with ML service
            const result = await kycService.analyzeDocument(file);
            setAnalysisResult(result);

            if (result.forgeryScore > 70) {
                toast.error('Document appears to be potentially fraudulent');
            } else if (result.forgeryScore > 40) {
                toast.warning('Document requires additional review');
            } else {
                toast.success('Document verification complete');
            }
        } catch (err) {
            console.error('Document analysis failed:', err);
            setError(err.message || 'Failed to analyze document');
            toast.error('Document analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleContinue = () => {
        if (analysisResult) {
            onComplete({ file, analysisResult });
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            {!file && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={classNames(
                        'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                        isDragging
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    )}
                >
                    <input
                        type="file"
                        id="document-upload"
                        accept={DOCUMENT_CONFIG.ACCEPTED_TYPES.join(',')}
                        onChange={handleFileInput}
                        className="hidden"
                    />

                    <Upload
                        size={48}
                        className={classNames(
                            'mx-auto mb-4',
                            isDragging ? 'text-primary-500' : 'text-gray-400'
                        )}
                    />

                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload ID Document
                    </h3>

                    <p className="text-gray-500 mb-4">
                        Drag and drop your document here, or click to browse
                    </p>

                    <label
                        htmlFor="document-upload"
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        Select File
                    </label>

                    <p className="text-sm text-gray-400 mt-4">
                        Accepted formats: JPEG, PNG, PDF • Max size: {DOCUMENT_CONFIG.MAX_SIZE_MB}MB
                    </p>
                </div>
            )}

            {/* File Preview */}
            {file && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <FileText size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                        </div>

                        {!analysisResult && !isAnalyzing && (
                            <button
                                onClick={removeFile}
                                className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Image Preview */}
                    {preview && (
                        <div className="p-4 bg-gray-50">
                            <img
                                src={preview}
                                alt="Document preview"
                                className="max-h-64 mx-auto rounded-lg shadow-sm"
                            />
                        </div>
                    )}

                    {/* PDF indicator */}
                    {file.type === 'application/pdf' && (
                        <div className="p-4 bg-gray-50 text-center text-gray-500">
                            <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                            PDF Document
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <Alert type="error" title="Upload Error">
                    {error}
                </Alert>
            )}

            {/* Analysis Result */}
            {analysisResult && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        {analysisResult.forgeryScore <= 40 ? (
                            <CheckCircle size={20} className="text-success-500" />
                        ) : (
                            <AlertCircle size={20} className="text-warning-500" />
                        )}
                        Document Analysis Results
                    </h4>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Forgery Score</p>
                            <p className={classNames(
                                'text-2xl font-bold',
                                analysisResult.forgeryScore <= 40 ? 'text-success-500' :
                                    analysisResult.forgeryScore <= 70 ? 'text-warning-500' : 'text-danger-500'
                            )}>
                                {analysisResult.forgeryScore}%
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Confidence</p>
                            <p className="text-2xl font-bold text-primary-500">
                                {analysisResult.confidence || 95}%
                            </p>
                        </div>
                    </div>

                    {analysisResult.flags && analysisResult.flags.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Detection Flags:</p>
                            <ul className="space-y-1">
                                {analysisResult.flags.map((flag, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                        <AlertCircle size={14} className="text-warning-500" />
                                        {flag}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {file && !analysisResult && (
                    <Button
                        onClick={analyzeDocument}
                        loading={isAnalyzing}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Analyzing Document...
                            </>
                        ) : (
                            'Analyze Document'
                        )}
                    </Button>
                )}

                {analysisResult && (
                    <Button onClick={handleContinue} size="lg">
                        Continue to Biometric Verification
                    </Button>
                )}
            </div>
        </div>
    );
};

export default DocumentUpload;
