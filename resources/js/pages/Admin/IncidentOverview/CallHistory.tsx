import { Call } from './types';
import { CALL_STATUS_COLORS } from './constants';
import { formatDateTime, calculateDuration } from './utils';

interface CallHistoryProps {
    calls: Call[];
}

export default function CallHistory({ calls }: CallHistoryProps) {
    if (calls.length === 0) {
        return (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Call History</h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">📞</div>
                    <p className="text-sm text-slate-500">No calls recorded for this incident</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Call History ({calls.length})</h3>
            <p className="text-xs text-slate-500 mb-4">Voice calls associated with this incident</p>

            <div className="space-y-3">
                {calls.map((call) => (
                    <div
                        key={call.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                        {/* Call header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">
                                        {call.initiator_type === 'admin' ? '📞' : '📱'}
                                    </span>
                                    <h4 className="font-semibold text-slate-800 text-sm">
                                        {call.initiator_type === 'admin' ? 'Admin' : 'Community'} Call
                                    </h4>
                                </div>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    CALL_STATUS_COLORS[call.status]
                                }`}
                            >
                                {call.status.toUpperCase()}
                            </span>
                        </div>

                        {/* Participants */}
                        <div className="grid gap-3 sm:grid-cols-2 mb-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Caller</p>
                                <p className="text-sm font-medium text-slate-800">{call.caller.name}</p>
                                <p className="text-xs text-slate-500">{call.caller.phone_number}</p>
                            </div>
                            {call.receiver && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">Receiver (Admin)</p>
                                    <p className="text-sm font-medium text-slate-800">{call.receiver.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Call duration */}
                        {call.status === 'ended' && (
                            <div className="mb-3">
                                <p className="text-xs text-slate-500 mb-0.5">Duration</p>
                                <p className="text-sm font-medium text-slate-700">
                                    {calculateDuration(call.started_at, call.ended_at)}
                                </p>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="pt-3 border-t border-slate-100 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Started:</span>
                                <span className="text-slate-700">{formatDateTime(call.started_at)}</span>
                            </div>
                            {call.answered_at && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Answered:</span>
                                    <span className="text-slate-700">{formatDateTime(call.answered_at)}</span>
                                </div>
                            )}
                            {call.ended_at && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Ended:</span>
                                    <span className="text-slate-700">{formatDateTime(call.ended_at)}</span>
                                </div>
                            )}
                        </div>

                        {/* Channel name (for debugging) */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Channel: {call.channel_name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
