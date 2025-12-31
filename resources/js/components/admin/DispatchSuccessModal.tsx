import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Responder {
    id: number;
    name: string;
    distance_text: string;
    duration_text: string;
}

interface DispatchSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    responder: Responder | null;
    message: string;
}

export function DispatchSuccessModal({
    isOpen,
    onClose,
    responder,
    message,
}: DispatchSuccessModalProps) {
    if (!responder) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-white">
                {/* Success Animation */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        {/* Animated rings */}
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                        <div className="absolute inset-2 rounded-full bg-green-500/10 animate-pulse"></div>

                        {/* Icon */}
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                            <svg
                                className="w-10 h-10 text-white animate-[scale-in_0.3s_ease-out]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        Dispatch Successful!
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="space-y-3 py-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                                {responder.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{responder.name}</h3>
                                <p className="text-sm text-slate-600">Assigned Responder</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-md p-3 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">Distance</div>
                                <div className="text-lg font-bold text-green-600">
                                    {responder.distance_text}
                                </div>
                            </div>
                            <div className="bg-white rounded-md p-3 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">ETA</div>
                                <div className="text-lg font-bold text-emerald-600">
                                    {responder.duration_text}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex gap-2">
                            <svg
                                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            <p className="text-sm text-blue-800">
                                The responder has been notified via their mobile app and can now accept the assignment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition"
                    >
                        Return to Dashboard
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
