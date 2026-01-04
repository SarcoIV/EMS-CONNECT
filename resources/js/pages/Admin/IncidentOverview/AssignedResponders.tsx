import { Dispatch } from './types';
import { DISPATCH_STATUS_COLORS } from './constants';
import { formatDateTime } from './utils';

interface AssignedRespondersProps {
    dispatches: Dispatch[];
}

export default function AssignedResponders({ dispatches }: AssignedRespondersProps) {
    if (dispatches.length === 0) {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Assigned Responders</h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🚑</div>
                    <p className="text-sm text-slate-500">No responders assigned to this incident yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Assigned Responders ({dispatches.length})
            </h3>

            <div className="space-y-3">
                {dispatches.map((dispatch) => (
                    <div
                        key={dispatch.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                        {/* Responder header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">{dispatch.responder.name}</h4>
                                <p className="text-sm text-slate-500">{dispatch.responder.phone_number}</p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    DISPATCH_STATUS_COLORS[dispatch.status]
                                }`}
                            >
                                {dispatch.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        {/* Distance and ETA */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <p className="text-xs text-slate-500">Distance</p>
                                <p className="text-sm font-medium text-slate-700">{dispatch.distance_text}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">ETA</p>
                                <p className="text-sm font-medium text-slate-700">{dispatch.duration_text}</p>
                            </div>
                        </div>

                        {/* Location update */}
                        {dispatch.responder.location_updated_at && (
                            <div className="text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Last location: {formatDateTime(dispatch.responder.location_updated_at)}
                                </span>
                            </div>
                        )}

                        {/* Assigned by */}
                        {dispatch.assigned_by && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                Assigned by: {dispatch.assigned_by.name}
                            </div>
                        )}

                        {/* Cancellation reason */}
                        {dispatch.cancellation_reason && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">
                                    {dispatch.status === 'declined' ? 'Decline' : 'Cancellation'} Reason:
                                </p>
                                <p className="text-sm text-slate-700">{dispatch.cancellation_reason}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
