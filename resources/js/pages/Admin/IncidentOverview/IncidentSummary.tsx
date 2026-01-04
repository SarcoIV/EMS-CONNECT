import { Incident } from './types';
import { INCIDENT_STATUS_COLORS, INCIDENT_TYPE_ICONS } from './constants';
import { formatDateTime } from './utils';

interface IncidentSummaryProps {
    incident: Incident;
}

export default function IncidentSummary({ incident }: IncidentSummaryProps) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            {/* Header with type icon and status */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{INCIDENT_TYPE_ICONS[incident.type]}</div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 capitalize">
                            {incident.type.replace('_', ' ')} Emergency
                        </h2>
                        <p className="text-sm text-slate-500">Incident ID: #{incident.id.toString().padStart(4, '0')}</p>
                    </div>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${INCIDENT_STATUS_COLORS[incident.status]}`}>
                    {incident.status.toUpperCase()}
                </span>
            </div>

            {/* Incident details grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Location */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-sm text-slate-800">{incident.address}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                    </p>
                </div>

                {/* Reporter */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Reporter</p>
                    <p className="text-sm font-medium text-slate-800">{incident.reporter.name}</p>
                    <p className="text-xs text-slate-500">{incident.reporter.phone_number}</p>
                    <p className="text-xs text-slate-500">{incident.reporter.email}</p>
                </div>

                {/* Assigned Admin */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Admin</p>
                    {incident.assigned_admin ? (
                        <p className="text-sm font-medium text-slate-800">{incident.assigned_admin.name}</p>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Not assigned</p>
                    )}
                </div>

                {/* Reported Time */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Reported</p>
                    <p className="text-sm text-slate-800">{formatDateTime(incident.created_at)}</p>
                </div>

                {/* Dispatched Time */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Dispatched</p>
                    {incident.dispatched_at ? (
                        <p className="text-sm text-slate-800">{formatDateTime(incident.dispatched_at)}</p>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Not yet dispatched</p>
                    )}
                </div>

                {/* Completed Time */}
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                    {incident.completed_at ? (
                        <p className="text-sm text-slate-800">{formatDateTime(incident.completed_at)}</p>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Not yet completed</p>
                    )}
                </div>
            </div>

            {/* Description */}
            {incident.description && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{incident.description}</p>
                </div>
            )}

            {/* Responder counters */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex gap-6">
                    <div>
                        <p className="text-xs text-slate-500">Assigned</p>
                        <p className="text-2xl font-bold text-blue-600">{incident.responders_assigned}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">En Route</p>
                        <p className="text-2xl font-bold text-purple-600">{incident.responders_en_route}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Arrived</p>
                        <p className="text-2xl font-bold text-amber-600">{incident.responders_arrived}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
