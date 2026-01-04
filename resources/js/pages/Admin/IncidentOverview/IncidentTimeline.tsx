import { Incident } from './types';
import { buildTimeline, formatDateTime, formatTime } from './utils';

interface IncidentTimelineProps {
    incident: Incident;
}

export default function IncidentTimeline({ incident }: IncidentTimelineProps) {
    const events = buildTimeline(incident);

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Incident Timeline</h3>
            <p className="text-xs text-slate-500 mb-6">Chronological sequence of events</p>

            {events.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">⏱️</div>
                    <p className="text-sm text-slate-500">No timeline events recorded</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
                    {events.map((event, index) => (
                        <div key={event.id} className="relative">
                            {/* Timeline dot */}
                            <div
                                className={`absolute -left-[28px] w-5 h-5 rounded-full ring-4 ring-white ${event.color}`}
                            />

                            {/* Event content */}
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-800 text-sm">{event.title}</h4>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>
                                {event.details && (
                                    <p className="text-sm text-slate-600 mb-1">{event.details}</p>
                                )}
                                <p className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</p>
                            </div>

                            {/* Connecting line (don't show for last event) */}
                            {index < events.length - 1 && (
                                <div className="absolute -left-[26px] top-6 w-0.5 h-full bg-slate-200" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
