import { useState, FormEvent } from 'react';
import axios from 'axios';

interface CreateIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    callerId: number;
    callerName: string;
    callId: number;
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">
                        Create Emergency Report
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                {/* Caller Info */}
                <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800">
                        Creating report for:{' '}
                        <span className="font-semibold">{callerName}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Emergency Type */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Emergency Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) =>
                                setFormData({ ...formData, type: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Location / Address *
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                            placeholder="Enter street address, landmark, or area"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            required
                            disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Ask caller for specific address or nearby landmark
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
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
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                            <p className="text-sm text-green-700 font-medium">
                                ✅ {successMessage}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                You can now end the call and proceed to dispatch.
                            </p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        {!successMessage ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Save Incident Report'}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 transition"
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
