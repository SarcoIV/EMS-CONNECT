import { useState, FormEvent } from 'react';
import axios from 'axios';

interface Incident {
    id: number;
    type: string;
    location: any;
    description: string;
}

interface CreateIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    callerId: number;
    callerName: string;
    callId: number;
    existingIncident?: Incident | null;
    onIncidentCreated?: (incident: any) => void;
}

const INCIDENT_TYPES = [
    { value: 'medical', label: 'Medical Emergency', color: 'red' },
    { value: 'fire', label: 'Fire', color: 'orange' },
    { value: 'accident', label: 'Accident', color: 'yellow' },
    { value: 'crime', label: 'Crime', color: 'purple' },
    { value: 'natural_disaster', label: 'Natural Disaster', color: 'blue' },
    { value: 'other', label: 'Other', color: 'gray' },
];

export function CreateIncidentModal({
    isOpen,
    onClose,
    callerId,
    callerName,
    callId,
    existingIncident,
    onIncidentCreated,
}: CreateIncidentModalProps) {
    const [formData, setFormData] = useState({
        type: 'medical',
        address: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await axios.post('/admin/incidents/create', {
                user_id: callerId,
                call_id: callId,
                type: formData.type,
                address: formData.address,
                description: formData.description,
            });

            const incident = response.data.incident;

            console.log('[INCIDENT] ✅ Incident created successfully:', incident);

            // Show success message
            setSuccessMessage(`Incident #${incident.id} created successfully!`);

            // Call the callback to update parent component
            if (onIncidentCreated) {
                onIncidentCreated(incident);
            } else {
                // Fallback: Redirect to dispatch page if no callback provided
                setTimeout(() => {
                    window.location.href = `/admin/dispatch/${incident.id}`;
                }, 1500);
            }

            setIsSubmitting(false);
        } catch (err) {
            console.error('Failed to create incident:', err);
            const errorMessage =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : 'Failed to create incident report. Please try again.';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Create Emergency Report
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                        disabled={isSubmitting}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Caller Info */}
                <div className="mb-5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 p-4">
                    <p className="text-sm text-blue-900">
                        Creating report for:{' '}
                        <span className="font-bold">{callerName}</span>
                    </p>
                </div>

                {/* Warning Banner - Existing Incident */}
                {existingIncident && (
                    <div className="mb-5 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200">
                                <span className="text-lg">⚠️</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-yellow-900">
                                    Incident #{existingIncident.id} Already Linked
                                </p>
                                <p className="text-xs text-yellow-800 mt-1">
                                    Creating a new incident will replace the existing one.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Emergency Type */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Emergency Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({ ...formData, type: e.target.value })
                            }
                            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 transition-all focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:cursor-not-allowed"
                            required
                            disabled={isSubmitting}
                        >
                            {INCIDENT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Location / Address *
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                            placeholder="Enter street address, landmark, or area"
                            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:cursor-not-allowed"
                            required
                            disabled={isSubmitting}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Ask caller for specific address or nearby landmark
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Describe the emergency situation in detail..."
                            rows={4}
                            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
                                    <span className="text-lg">✅</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-green-900">
                                        {successMessage}
                                    </p>
                                    <p className="text-xs text-green-800 mt-1">
                                        You can now end the call and proceed to dispatch.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200">
                                    <span className="text-lg">❌</span>
                                </div>
                                <p className="flex-1 text-sm font-medium text-red-900">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3">
                        {!successMessage ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl border-2 border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3 font-semibold text-white hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        'Save Incident Report'
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 active:scale-95"
                            >
                                Close & Continue Call
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
