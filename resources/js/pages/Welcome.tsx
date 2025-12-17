import { Card, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { Activity, Clock, MapPin, Navigation, Radio, Zap } from 'lucide-react';

export default function Welcome() {
    return (
        <>
            <Head title="EMS Connect - Smart Emergency Response">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-600 via-red-500 to-orange-500 p-6">
                <div className="w-full max-w-5xl space-y-8">
                    {/* Hero Section */}
                    <div className="text-center text-white">
                        <div className="mb-6 flex justify-center gap-3">
                            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Activity className="h-10 w-10" />
                            </div>
                            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Navigation className="h-10 w-10" />
                            </div>
                            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                                <Zap className="h-10 w-10" />
                            </div>
                        </div>

                        <h1 className="mb-4 text-6xl font-bold tracking-tight">EMS Connect</h1>

                        <p className="mb-4 text-2xl font-semibold text-white/90">Emergency Medical Services Station Management System</p>

                        <p className="mx-auto max-w-3xl text-lg text-white/80">
                            Web & mobile-based smart dispatch system utilizing Dijkstra's and A* algorithms for real-time response optimization in
                            Project 6, Quezon City
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-none bg-white/95 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="rounded-full bg-red-100 p-3">
                                        <MapPin className="h-8 w-8 text-red-600" />
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Smart Dispatch</h3>
                                <p className="text-gray-600">Optimal route calculation using advanced pathfinding algorithms</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white/95 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="rounded-full bg-blue-100 p-3">
                                        <Clock className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Real-Time Tracking</h3>
                                <p className="text-gray-600">Live ambulance location and response time monitoring</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white/95 backdrop-blur-sm">
                            <CardContent className="p-6 text-center">
                                <div className="mb-4 flex justify-center">
                                    <div className="rounded-full bg-orange-100 p-3">
                                        <Radio className="h-8 w-8 text-orange-600" />
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Instant Response</h3>
                                <p className="text-gray-600">Automated station management and emergency coordination</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
