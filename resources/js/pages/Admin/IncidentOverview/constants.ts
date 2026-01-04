export const DISPATCH_STATUS_COLORS: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-700',
    accepted: 'bg-cyan-100 text-cyan-700',
    en_route: 'bg-purple-100 text-purple-700',
    arrived: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-700',
    declined: 'bg-red-100 text-red-700',
};

export const INCIDENT_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    dispatched: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-700',
};

export const INCIDENT_TYPE_ICONS: Record<string, string> = {
    medical: '🏥',
    fire: '🔥',
    accident: '🚗',
    crime: '🚨',
    natural_disaster: '🌊',
    other: '⚠️',
};

export const CALL_STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    ended: 'bg-slate-100 text-slate-700',
};
