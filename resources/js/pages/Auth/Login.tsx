import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { route } from 'ziggy-js';

interface LoginProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Login({ flash }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const [authError, setAuthError] = useState<string | null>(null);
    const [flashMessage, setFlashMessage] = useState<{
        type: 'success' | 'error' | null;
        message: string | null;
    }>({ type: null, message: null });

    // Check for flash messages
    useEffect(() => {
        if (flash?.success) {
            setFlashMessage({
                type: 'success',
                message: flash.success,
            });
        } else if (flash?.error) {
            setFlashMessage({
                type: 'error',
                message: flash.error,
            });
        } else {
            setFlashMessage({ type: null, message: null });
        }
    }, [flash]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setFlashMessage({ type: null, message: null });

        post(route('auth.login.store'), {
            onError: (errors) => {
                // If we received an authentication error from the backend
                if (errors.auth) {
                    setAuthError(errors.auth);
                }
            },
        });
    };

    return (
        <>
            <Head title="Login - EMS Connect" />
            <div className="relative flex min-h-screen items-center justify-center bg-[#f7f2f2] px-4 py-8 overflow-hidden">
                {/* Animated EMS background accents */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 top-10 h-48 w-48 rounded-full bg-red-400/20 blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-[#7a1818]/25 blur-3xl" />
                    <div className="absolute inset-x-0 top-1/3 mx-auto h-40 max-w-xl rounded-full border border-red-200/40 bg-gradient-to-r from-red-100/10 via-transparent to-red-100/10" />

                    {/* Centered EMS watermark on white background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                        <img
                            src="/images/597486658_1215193403858896_2072558280615266887_n.png"
                            alt="EMS watermark"
                            className="max-h-[520px] w-auto object-contain"
                        />
                    </div>

                    {/* Side EMS illustration overlay on background */}
                    <div className="absolute inset-y-10 right-[-3rem] hidden w-72 opacity-10 sm:block">
                        <img
                            src="/images/597486658_1215193403858896_2072558280615266887_n.png"
                            alt="EMS responders illustration"
                            className="h-full w-full object-contain transform scale-110"
                        />
                    </div>
                </div>

                <Card className="relative z-10 w-full max-w-md rounded-3xl border border-[#5a1010] bg-[#7a1818] text-red-50 shadow-xl">
                    <CardContent className="p-8 sm:p-10">
                        <div className="mb-6 flex flex-col items-center gap-5">
                            <img
                                src="/images/597486658_1215193403858896_2072558280615266887_n.png"
                                alt="EMS Connect logo"
                                className="h-28 w-28 object-contain"
                            />
                            <div className="text-center">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                    Welcome Back
                                </h1>
                                <p className="mt-1 text-xs sm:text-sm text-red-100">
                                    Sign in to continue to EMS Connect.
                                </p>
                            </div>
                        </div>

                        {/* Show flash messages */}
                        {flashMessage.message && (
                            <Alert variant={flashMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                                <AlertDescription>{flashMessage.message}</AlertDescription>
                            </Alert>
                        )}

                        {/* Show authentication error if any */}
                        {authError && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{authError}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium text-red-50">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full rounded-xl border-red-100/70 bg-white/95 text-sm text-[#2b0b0b] focus-visible:ring-red-200"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-medium text-red-50">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border-red-100/70 bg-white/95 text-sm text-[#2b0b0b] focus-visible:ring-red-200"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-4 w-full rounded-full border border-transparent bg-white text-sm font-semibold text-[#7a1818] hover:bg-red-50"
                                disabled={processing}
                            >
                                {processing ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>

                        {/* Divider & Google Auth */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t"></div>
                            </div>
                            <div className="relative flex justify-center text-sm uppercase">
                                <span className="bg-[#7a1818] px-2 text-xs font-medium uppercase tracking-wide text-red-100">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full rounded-full border border-transparent bg-white text-sm text-[#2b0b0b] hover:bg-red-50"
                            onClick={() => {
                                window.location.href = route('auth.google');
                            }}
                        >
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                                <path
                                    fill="#4285F4"
                                    d="M24 9.5c3.54 0 6.52 1.28 8.96 3.36l6.64-6.64C34.82 2.02 29.7 0 24 0 14.32 0 6.06 5.74 2.21 13.97l7.81 6.07C12.12 13.34 17.56 9.5 24 9.5z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M46.04 24.5c0-1.47-.13-2.88-.37-4.25H24v8.5h12.54c-.56 2.87-2.07 5.32-4.26 7.05l6.7 6.7c4.31-3.98 6.77-9.79 6.77-16z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M10.26 28.65c-.64-1.91-1-3.95-1-6.05s.36-4.14 1-6.05l-7.81-6.07C.79 13.17 0 18.44 0 24c0 5.56.79 10.83 2.21 15.52l8.05-6.18z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M24 48c5.7 0 10.82-2.02 14.7-5.45l-6.7-6.7c-1.96 1.31-4.42 2.07-7 2.07-6.44 0-11.88-3.84-14.04-9.35l-8.05 6.18C6.06 42.26 14.32 48 24 48z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        {/* Signup Link */}
                        <p className="mt-4 text-center text-xs sm:text-sm text-red-100">
                            Don't have an account?{' '}
                            <a
                                href={route('auth.register')}
                                className="font-semibold text-white underline-offset-2 hover:underline"
                            >
                                Sign up
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
