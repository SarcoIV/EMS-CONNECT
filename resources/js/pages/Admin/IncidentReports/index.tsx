import React, { useState } from 'react';
import { Header } from '@/components/admin/header';
import { Sidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    ChevronRight,
    FileText,
    Clock,
    DollarSign,
    Users,
    TrendingUp,
    AlertCircle,
    Bookmark,
    User,
    X,
    Check,
} from 'lucide-react';

interface User {
    name: string;
    email: string;
}

interface IncidentReportsProps {
    user: User;
}

export default function IncidentReports({ user }: IncidentReportsProps) {
    const [formData, setFormData] = useState({
        reportNumber: '101',
        profile: 'Ambulance Response',
        content: 'Patient requiring urgent medical assistance',
        capacity: '2 (two responders dispatched)',
        initialPriority: '',
    });

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleClear = () => {
        setFormData({
            reportNumber: '',
            profile: '',
            content: '',
            capacity: '',
            initialPriority: '',
        });
    };

    const handleGenerate = () => {
        // Frontend only - just log for now
        console.log('Generating report with data:', formData);
        // In real implementation, this would submit to backend
    };

    // Chart data - stacked area chart
    const chartData = [
        { date: '16', location: 'Cub', low: 5, medium: 8, high: 3 },
        { date: '17', location: 'Project 6', low: 7, medium: 12, high: 5 },
        { date: '18', location: 'Quezon City', low: 4, medium: 10, high: 4 },
        { date: '19', location: 'Project 6', low: 6, medium: 9, high: 6 },
        { date: '20', location: 'Quezon City', low: 8, medium: 11, high: 7 },
    ];

    const emergencyReportsItems = [
        {
            category: 'Responder Performance',
            items: ['Response Time (minutes)', 'Incident Handling Efficiency', 'Responder Availability Rate'],
        },
        {
            category: 'Patient Condition on Arrival',
            items: ['Pre-Arrival First Aid Applied', 'Outcome Status (Resolved, Transferred, In Progress)'],
        },
        {
            category: 'Location',
            items: ['Project 6, Quezon City (Specific Barangay Zones)', 'Nearby Areas (Scalable)'],
        },
    ];

    const restrictedReportsItems = [
        { category: 'Full list of reports', items: [] },
        {
            category: 'Time reports',
            items: ['Detailed timesheet', 'Hours approved', 'Lost hours'],
        },
        {
            category: 'Cost and expenses reports',
            items: ['Project costs and expenses', 'Project expenses'],
        },
        {
            category: 'Allocation and forecast reports',
            items: ['Staff allocation', 'Resource forecast'],
        },
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar user={user} />

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Incident Reports</h1>
                                <p className="mt-2 text-sm text-gray-500">Manage and generate incident reports</p>
                            </div>
                        </div>

                        {/* Patient Related Data Section */}
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Patient related Data</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {/* Emergency Reports Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-gray-900">
                                            Emergency reports
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {emergencyReportsItems.map((section, idx) => (
                                            <Collapsible
                                                key={idx}
                                                open={openSections[`emergency-${idx}`]}
                                                onOpenChange={() => toggleSection(`emergency-${idx}`)}
                                            >
                                                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
                                                    <span>{section.category}</span>
                                                    <ChevronRight
                                                        className={`h-4 w-4 transition-transform ${
                                                            openSections[`emergency-${idx}`] ? 'rotate-90' : ''
                                                        }`}
                                                    />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="space-y-1 pl-4">
                                                    {section.items.map((item, itemIdx) => (
                                                        <div
                                                            key={itemIdx}
                                                            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                                                        >
                                                            <ChevronRight className="h-3 w-3 text-gray-400" />
                                                            <span>{item}</span>
                                                        </div>
                                                    ))}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Restricted Reports Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-gray-900">
                                            Restricted reports
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {restrictedReportsItems.map((section, idx) => (
                                            <Collapsible
                                                key={idx}
                                                open={openSections[`restricted-${idx}`]}
                                                onOpenChange={() => toggleSection(`restricted-${idx}`)}
                                            >
                                                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
                                                    <span>{section.category}</span>
                                                    <ChevronRight
                                                        className={`h-4 w-4 transition-transform ${
                                                            openSections[`restricted-${idx}`] ? 'rotate-90' : ''
                                                        }`}
                                                    />
                                                </CollapsibleTrigger>
                                                {section.items.length > 0 && (
                                                    <CollapsibleContent className="space-y-1 pl-4">
                                                        {section.items.map((item, itemIdx) => (
                                                            <div
                                                                key={itemIdx}
                                                                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                                                            >
                                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                                                <span>{item}</span>
                                                            </div>
                                                        ))}
                                                    </CollapsibleContent>
                                                )}
                                            </Collapsible>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Bookkeeping Report Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold text-gray-900">
                                            Bookkeeping report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* User - Projects Card */}
                                        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 ring-2 ring-red-200">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
                                                <AlertCircle className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-red-900">User - Projects</span>
                                                    <Bookmark className="h-4 w-4 text-red-600" />
                                                </div>
                                                <p className="text-xs text-red-700">View project assignments</p>
                                            </div>
                                        </div>

                                        {/* User by role */}
                                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                                                <User className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">User by role</p>
                                                <p className="text-xs text-gray-500">Role-based analytics</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Incident Reports Graph Card */}
                                <Card className="shadow-md transition-shadow hover:shadow-lg">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold text-gray-900">
                                                Incident Reports
                                            </CardTitle>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="text-xs">Trend analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                                                        </linearGradient>
                                                        <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                        </linearGradient>
                                                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#64748b"
                                                        style={{ fontSize: '11px' }}
                                                    />
                                                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="high"
                                                        stackId="1"
                                                        stroke="#ef4444"
                                                        fill="url(#colorHigh)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="medium"
                                                        stackId="1"
                                                        stroke="#f59e0b"
                                                        fill="url(#colorMedium)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="low"
                                                        stackId="1"
                                                        stroke="#10b981"
                                                        fill="url(#colorLow)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
                                            <span>{chartData[0].location}</span>
                                            <span>{chartData[2].location}</span>
                                            <span>{chartData[4].location}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Incident Report Form Section */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-gray-900">Incident Report</CardTitle>
                                <CardDescription>Create and manage incident reports</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Read-only Information Fields */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                                            Branch
                                        </Label>
                                        <Input id="branch" value="Project 6" disabled className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="userDivision" className="text-sm font-medium text-gray-700">
                                            User division
                                        </Label>
                                        <Input id="userDivision" value="EMS Division" disabled className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user" className="text-sm font-medium text-gray-700">
                                            User
                                        </Label>
                                        <Input id="user" value="John Doe" disabled className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                                            Account
                                        </Label>
                                        <Input id="account" value="EMS Connect User" disabled className="bg-gray-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="project" className="text-sm font-medium text-gray-700">
                                            Project
                                        </Label>
                                        <Input id="project" value="EMS Connect" disabled className="bg-gray-50" />
                                    </div>
                                </div>

                                {/* Incident Details Section */}
                                <div className="border-t pt-6">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Incident Details</h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="reportNumber" className="text-sm font-medium text-gray-700">
                                                Report Number
                                            </Label>
                                            <Input
                                                id="reportNumber"
                                                value={formData.reportNumber}
                                                onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                                                placeholder="Enter report number"
                                                className="focus:ring-[#7a1818]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="profile" className="text-sm font-medium text-gray-700">
                                                Profile
                                            </Label>
                                            <Input
                                                id="profile"
                                                value={formData.profile}
                                                onChange={(e) => handleInputChange('profile', e.target.value)}
                                                placeholder="Enter profile"
                                                className="focus:ring-[#7a1818]"
                                            />
                                        </div>
                                        <div className="space-y-2 lg:col-span-2">
                                            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                                                Content
                                            </Label>
                                            <Input
                                                id="content"
                                                value={formData.content}
                                                onChange={(e) => handleInputChange('content', e.target.value)}
                                                placeholder="Enter incident content"
                                                className="focus:ring-[#7a1818]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                                                Capacity
                                            </Label>
                                            <Input
                                                id="capacity"
                                                value={formData.capacity}
                                                onChange={(e) => handleInputChange('capacity', e.target.value)}
                                                placeholder="Enter capacity"
                                                className="focus:ring-[#7a1818]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="initialPriority" className="text-sm font-medium text-gray-700">
                                                Initial Priority
                                            </Label>
                                            <Input
                                                id="initialPriority"
                                                value={formData.initialPriority}
                                                onChange={(e) => handleInputChange('initialPriority', e.target.value)}
                                                placeholder="Enter priority"
                                                className="focus:ring-[#7a1818]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 border-t pt-6">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={handleGenerate}
                                        className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Generate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}



