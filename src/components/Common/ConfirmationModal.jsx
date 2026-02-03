import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full animate-fade-in-up">
                    {/* Header */}
                    <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${isDanger ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className={`text-lg font-bold ${isDanger ? 'text-red-900' : 'text-gray-900'}`}>{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        <p className="text-gray-600">{message}</p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <button
                            onClick={onClose}
                            className="btn btn-secondary w-full sm:w-auto px-4 py-2"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`btn w-full sm:w-auto px-4 py-2 ${isDanger ? 'bg-red-600 hover:bg-red-700 text-white shadow-red' : 'btn-primary'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
