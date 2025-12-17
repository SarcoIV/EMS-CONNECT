import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
                <Card className="w-full max-w-md rounded-2xl shadow-xl">
                    <CardContent className="p-8 text-center">
                        <h1 className="mb-4 text-4xl font-bold text-gray-800">THIS IS MY PERSONAL BOILERPLATE</h1>
                        <p className="mb-6 text-lg text-gray-600">Simple and straightforward starter template.</p>

                        <div className="flex justify-center gap-4">
                            <Button variant="default" asChild>
                                <Link href={route('auth.login')}>Login</Link>
                            </Button>

                            <Button variant="outline" asChild>
                                <Link href={route('auth.register')}>Register</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
