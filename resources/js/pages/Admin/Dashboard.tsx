import { Header } from '@/components/admin/header'; // Import the Header component
import { Sidebar } from '@/components/admin/sidebar'; // Import the Sidebar component
import { IncomingCallNotification } from '@/components/admin/IncomingCallNotification'; // Import the IncomingCallNotification component
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface User {
    name: string;
    email: string;
}

interface DashboardProps {
    user: User;
}

export default function AdminDashboard({ user }: DashboardProps) {
    const incidentTrend = [
        { year: '2016', low: 120, medium: 80, high: 40, total: 240 },
        { year: '2017', low: 140, medium: 90, high: 60, total: 290 },
        { year: '2018', low: 110, medium: 100, high: 90, total: 300 },
        { year: '2019', low: 160, medium: 120, high: 110, total: 390 },
    ];

    const pieData = [
        { name: 'Medical Emergency', value: 36, color: '#10b981' },
        { name: 'Accident', value: 28, color: '#38bdf8' },
        { name: 'Fire / Hazard', value: 19, color: '#fcd34d' },
        { name: 'Others', value: 17, color: '#fb7185' },
    ];

    const totalReports = incidentTrend.reduce((sum, y) => sum + y.low + y.medium + y.high, 0);

    return (
        <div className="flex h-screen bg-[#f7f2f2]">
            {/* Incoming Call Notification */}
            <IncomingCallNotification />

            {/* Pass user data to the Sidebar component */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto bg-[#f7f2f2] p-4 md:p-6">
                    <div className="mx-auto flex max-w-6xl flex-col gap-6">
                        {/* Top summary + chart row */}
                        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
                            {/* Incident Reports card */}
                            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-100/70">
                                <header className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b53131]">
                                            Incident Reports
                                        </h2>
                                        <p className="mt-1 text-sm font-medium text-slate-800">Reports</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-2xl font-bold text-[#7a1818]">{totalReports}</p>
                                    </div>
                                </header>

                                {/* Stacked Area Chart */}
                                <div className="mt-4 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={incidentTrend}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.3} />
                                                </linearGradient>
                                                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="year"
                                                stroke="#64748b"
                                                style={{ fontSize: '12px' }}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                style={{ fontSize: '12px' }}
                                                domain={[0, 700]}
                                                ticks={[0, 200, 400, 700]}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="high"
                                                stackId="1"
                                                stroke="#8b5cf6"
                                                fill="url(#colorHigh)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="medium"
                                                stackId="1"
                                                stroke="#f97316"
                                                fill="url(#colorMedium)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="low"
                                                stackId="1"
                                                stroke="#14b8a6"
                                                fill="url(#colorLow)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Statistics donut + legend */}
                            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-100/70">
                                <header className="mb-4">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b53131]">
                                        Statistics
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-slate-800">Incident Type Statistics</p>
                                </header>

                                <div className="flex flex-col items-center gap-6 md:flex-row">
                                    {/* Pie/Donut Chart */}
                                    <div className="relative h-48 w-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={85}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[11px] font-medium text-slate-500">Incident Type</p>
                                                <p className="text-xs font-semibold text-slate-800">Statistics</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend with percentages */}
                                    <div className="grid flex-1 gap-2 text-xs">
                                        {pieData.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-sm text-slate-700">{item.name}</span>
                                                </div>
                                                <span className="font-semibold text-slate-700">{item.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Table row */}
                        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-100/70">
                            <header className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b53131]">
                                        Recent Incidents
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Latest emergency calls and their current status.
                                    </p>
                                </div>
                            </header>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-xs sm:text-sm">
                                    <thead className="border-b bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2">No</th>
                                            <th className="px-3 py-2">Name</th>
                                            <th className="px-3 py-2">Emergency Location</th>
                                            <th className="px-3 py-2">Date of Call</th>
                                            <th className="px-3 py-2">Type of Emergency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700">
                                        {[
                                            {
                                                id: 1,
                                                name: 'Jane Brincker',
                                                location: 'Brgy. Sto. Niño',
                                                date: '27/05/2018',
                                                type: 'Trauma',
                                                badge: 'bg-emerald-100 text-emerald-700',
                                            },
                                            {
                                                id: 2,
                                                name: 'Anthony Davie',
                                                location: 'Project 6',
                                                date: '21/05/2018',
                                                type: 'Anaphylaxis',
                                                badge: 'bg-rose-100 text-rose-700',
                                            },
                                            {
                                                id: 3,
                                                name: 'David Perry',
                                                location: 'City Center',
                                                date: '20/04/2018',
                                                type: 'Cardiac Arrest',
                                                badge: 'bg-red-100 text-red-700',
                                            },
                                            {
                                                id: 4,
                                                name: 'Alan Gilchrist',
                                                location: 'North Avenue',
                                                date: '22/05/2018',
                                                type: 'Respiratory Distress',
                                                badge: 'bg-sky-100 text-sky-700',
                                            },
                                        ].map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 text-xs text-slate-500">{row.id}</td>
                                                <td className="px-3 py-2">{row.name}</td>
                                                <td className="px-3 py-2">{row.location}</td>
                                                <td className="px-3 py-2 text-xs text-slate-500">{row.date}</td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.badge}`}
                                                    >
                                                        {row.type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
