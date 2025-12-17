import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="EMS Connect - Smart Emergency Response">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-[#f7f2f2] text-[#2b0b0b]">
                <Navbar />
                <main>
                    <Hero />
                    <About />
                    <Features />
                    <CallToAction />
                </main>
                <Footer />
            </div>
        </>
    );
}

function Navbar() {
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-[#7a1818]/95 backdrop-blur border-b border-[#5a1010]">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8 text-white">
                <button
                    type="button"
                    onClick={() => scrollToSection('home')}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    <div className="flex h-12 w-32 items-center justify-center overflow-hidden">
                        <img
                            src="/images/597486658_1215193403858896_2072558280615266887_n.png"
                            alt="EMS Connect logo"
                            className="h-full w-full object-cover transform scale-90"
                        />
                    </div>
                </button>

                <div className="hidden md:flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => scrollToSection('home')}
                        className="text-sm font-medium text-red-50 hover:text-white/90 transition-colors"
                    >
                        Home
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('about')}
                        className="text-sm font-medium text-red-50 hover:text-white/90 transition-colors"
                    >
                        About
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection('features')}
                        className="text-sm font-medium text-red-50 hover:text-white/90 transition-colors"
                    >
                        Features
                    </button>
                    <a
                        href="/login"
                        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7a1818] shadow-md hover:bg-red-50 hover:shadow-lg transition-all"
                    >
                        Login
                    </a>
                </div>

                <div className="flex md:hidden">
                    <a
                        href="/login"
                        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#7a1818] shadow-md hover:bg-red-50 hover:shadow-lg transition-all"
                    >
                        Login
                    </a>
                </div>
            </nav>
        </header>
    );
}

function Hero() {
    return (
        <section
            id="home"
            className="relative overflow-hidden border-b border-[#5a1010] bg-gradient-to-b from-[#7a1818] via-[#8b1f1f] to-[#b53131] text-white"
        >
            <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-12 px-4 py-16 sm:py-20 sm:px-6 lg:flex-row lg:py-24 lg:px-8">
                <div className="w-full lg:w-1/2">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-50 ring-1 ring-white/20">
                        Public Safety • Emergency Medical Services
                    </span>

                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                        Fast, Smart, and Reliable{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white">
                            Emergency Medical Response
                        </span>
                    </h1>

                    <p className="mt-5 text-base text-red-50/80 sm:text-lg max-w-xl">
                        EMS Connect is a web and mobile-based emergency medical services management system designed to reduce response
                        times and improve coordination between residents, responders, and local authorities.
                    </p>

                    <div className="mt-6 text-xs uppercase tracking-wide text-red-100">
                        Available as Web &amp; Mobile Application
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <a
                            href="#download"
                            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#7a1818] shadow-md hover:bg-red-50 hover:shadow-lg transition-all"
                        >
                            Download App
                        </a>
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center rounded-full border border-red-100/80 bg-transparent px-6 py-3 text-sm font-semibold text-red-50 shadow-sm hover:bg-white/5 hover:border-white hover:text-white transition-all"
                        >
                            Login
                        </a>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-red-100/80">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Live coordination between residents & responders
                        </div>
                        <span className="hidden sm:inline-block text-red-200/60">•</span>
                        <span>Optimized for barangay and city-level deployment</span>
                    </div>

                    <div
                        id="download"
                        className="mt-8 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-red-50/90"
                    >
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wide text-red-200">
                                    Get it on
                                </span>
                                <span className="text-sm font-semibold">Google Play</span>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-black/10 px-4 py-3 backdrop-blur-sm">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wide text-red-200">
                                    Download on the
                                </span>
                                <span className="text-sm font-semibold">App Store</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2">
                    <div className="relative mx-auto max-w-xs sm:max-w-sm rounded-[2.2rem] bg-white shadow-2xl ring-4 ring-black/5 overflow-hidden">
                        <div className="h-7 bg-[#5a1010] flex items-center justify-between px-4 text-[10px] text-red-100">
                            <span>WELCOME, EMT John Doe</span>
                            <span className="text-xs">Available</span>
                        </div>

                        <div className="bg-[#7a1818] px-5 py-3 text-xs text-red-50 flex items-center justify-between">
                            <span className="font-semibold">Active Incidents</span>
                            <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Online
                            </span>
                        </div>

                        <div className="bg-[#f9f4f4] px-4 py-4 space-y-3">
                            {[
                                { title: 'Car Accident', level: 'HIGH', color: 'bg-red-500', road: '57-37 Rd 8' },
                                { title: 'Heart Attack', level: 'HIGH', color: 'bg-red-500', road: '63-43 Rd 2' },
                                { title: 'Electrocuted', level: 'MID', color: 'bg-amber-500', road: '28 Rd 7' },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl bg-[#7a1818]/90 px-4 py-3 text-red-50 shadow-sm"
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold">{item.title}</span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${item.color}`}
                                        >
                                            {item.level}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[11px] text-red-100">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-200" />
                                        <span>{item.road}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-red-100/60 bg-white px-4 py-3 text-[11px] text-slate-700 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Patient Information</p>
                                <p className="text-[10px] text-slate-500">Tap to fill out incident details</p>
                            </div>
                            <button className="rounded-full bg-[#7a1818] px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
                                Open Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function About() {
    return (
        <section id="about" className="bg-[#f7f2f2] border-b border-red-100 py-16 sm:py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl rounded-3xl bg-white/90 shadow-sm ring-1 ring-red-100/60 px-6 py-10 sm:px-10 sm:py-12">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                        <div className="lg:w-2/3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2b0b0b]">
                                About EMS Connect
                            </h2>
                            <p className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#b53131]">
                                Built for barangays, cities, and local EMS teams
                            </p>

                            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-700">
                                <p>
                                    EMS Connect is a web and mobile-based Emergency Medical Services (EMS) platform developed to improve
                                    emergency response efficiency in local communities. The system allows residents to send one-tap
                                    emergency alerts, share real-time locations, and track responding ambulances live.
                                </p>
                                <p>
                                    For EMS responders and dispatchers, EMS Connect provides smart dispatching, optimized routing using A*
                                    and Dijkstra’s algorithms, real-time communication, and performance monitoring through a centralized
                                    dashboard.
                                </p>
                                <p>
                                    Designed for barangay and city-level deployment, EMS Connect aims to reduce response times, improve
                                    coordination, and enhance public safety through real-time technology.
                                </p>
                            </div>
                        </div>

                        <div className="lg:w-1/3">
                            <div className="grid gap-4">
                                <div className="rounded-2xl bg-[#7a1818] px-4 py-4 text-xs sm:text-sm text-red-50 shadow-sm">
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-red-100/80">
                                        Key Outcomes
                                    </p>
                                    <p className="mt-2 text-sm sm:text-base font-semibold">
                                        Faster emergency response and clearer coordination between residents and EMS teams.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-red-50 px-4 py-4 text-xs sm:text-sm text-[#4b1010] shadow-sm">
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#b53131]">
                                        Optimized Routing
                                    </p>
                                    <p className="mt-2">
                                        Pathfinding powered by A* and Dijkstra helps dispatchers choose the best units and routes.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white px-4 py-4 text-xs sm:text-sm text-slate-700 shadow-sm border border-red-100/70">
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#b53131]">
                                        Deployment Ready
                                    </p>
                                    <p className="mt-2">
                                        Built for rollout at barangay and city scale with monitoring tools for local decision-makers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Features() {
    const features = [
        {
            title: 'One-Tap Emergency Alerts',
            description:
                'Residents can submit emergency alerts in seconds with a single tap, including optional notes and contact details.',
            accent: 'from-red-500 to-red-600',
            icon: '⚡',
        },
        {
            title: 'Real-Time Ambulance Tracking',
            description:
                'Track responding ambulances live on the map so residents and responders know exactly where help is.',
            accent: 'from-sky-500 to-sky-600',
            icon: '📍',
        },
        {
            title: 'Smart Dispatch & Route Optimization',
            description:
                'Dispatch the nearest available unit and compute fastest routes using A* and Dijkstra’s algorithms.',
            accent: 'from-emerald-500 to-emerald-600',
            icon: '🧭',
        },
        {
            title: 'In-App Chat & Voice Communication',
            description:
                'Enable secure messaging and voice coordination between dispatchers, ambulance crews, and partner facilities.',
            accent: 'from-[#b53131] to-[#7a1818]',
            icon: '📞',
        },
        {
            title: 'Admin Dashboard & Analytics',
            description:
                'Monitor key metrics like response time, case types, and coverage to continuously improve EMS performance.',
            accent: 'from-amber-500 to-amber-600',
            icon: '📊',
        },
        {
            title: 'Community-Focused Design',
            description:
                'Tailored for barangays and cities with localized workflows, languages, and connectivity realities.',
            accent: 'from-pink-500 to-rose-500',
            icon: '🌍',
        },
    ] as const;

    return (
        <section id="features" className="bg-gradient-to-b from-[#f7f2f2] via-[#f9f5f5] to-[#f3eded] border-b border-red-100 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2b0b0b]">
                        Features for Residents, Responders, and Local Governments
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-600">
                        EMS Connect brings together emergency alerts, dispatching, routing, and communication in one unified platform
                        designed for real-world emergency operations.
                    </p>
                </div>

                <div className="mt-10 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-red-100/80 sm:p-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <article
                                key={feature.title}
                                className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:ring-[#b53131]/50 transition-all"
                            >
                                <div
                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white text-lg shadow-md`}
                                >
                                    <span>{feature.icon}</span>
                                </div>
                                <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#2b0b0b]">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-slate-600">{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function CallToAction() {
    return (
        <section id="cta" className="bg-gradient-to-r from-[#7a1818] via-[#8b1f1f] to-[#b53131] py-14 sm:py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-white">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Bring faster emergency response to your community.
                </h2>
                <p className="mt-3 text-sm sm:text-base text-sky-100">
                    Deploy EMS Connect for your barangay, city, or EMS organization and start reducing response times with real-time
                    alerts, tracking, and smart dispatching.
                </p>
                <div className="mt-7 flex justify-center">
                    <a
                        href="/login"
                        className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#7a1818] shadow-md hover:bg-red-50 hover:shadow-lg transition-all"
                    >
                        Login to EMS Connect
                    </a>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="bg-[#2b0b0b] py-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p className="text-xs sm:text-sm">EMS Connect © 2025. All rights reserved.</p>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                    <a href="#" className="hover:text-sky-400 transition-colors">
                        Privacy Policy
                    </a>
                    <a href="#" className="hover:text-sky-400 transition-colors">
                        Terms
                    </a>
                    <a href="#" className="hover:text-sky-400 transition-colors">
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
}
