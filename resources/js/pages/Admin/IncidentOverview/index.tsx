import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification';
import { Link } from '@inertiajs/react';
import { IncidentOverviewProps } from './types';
import IncidentSummary from './IncidentSummary';
import AssignedResponders from './AssignedResponders';
import IncidentTimeline from './IncidentTimeline';
import PreArrivalInfo from './PreArrivalInfo';
import CallHistory from './CallHistory';

export default function IncidentOverview({ user, incident }: IncidentOverviewProps) {
    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30">
            <IncomingCallNotification />
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm">
                            <Link
                                href="/admin/incident-reports"
                                className="text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Incident Reports
                            </Link>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-700 font-medium">
                                Incident #{incident.id.toString().padStart(4, '0')}
                            </span>
                        </div>

                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Incident Overview</h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    Detailed monitoring view of incident #{incident.id.toString().padStart(4, '0')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/admin/live-map?incident=${incident.id}`}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                            />
                                        </svg>
                                        View on Map
                                    </span>
                                </Link>
                                <Link
                                    href="/admin/incident-reports"
                                    className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                                >
                                    Back to Reports
                                </Link>
                            </div>
                        </div>

                        {/* Incident Summary */}
                        <IncidentSummary incident={incident} />

                        {/* Two-column layout */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <AssignedResponders dispatches={incident.dispatches} />
                                <PreArrivalInfo dispatches={incident.dispatches} />
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <IncidentTimeline incident={incident} />
                                <CallHistory calls={incident.calls} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
