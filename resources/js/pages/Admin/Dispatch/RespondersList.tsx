import { formatDistanceToNow } from 'date-fns';

interface Responder {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    responder_status: string;
    is_on_duty: boolean;
    location_updated_at: string | null;
    distance_meters: number | null;
    distance_text: string;
    duration_seconds: number | null;
    duration_text: string;
    distance_method?: string;
}

interface AvailabilityDiagnostics {
    total_responders: number;
    verified: number;
    on_duty: number;
    idle: number;
    with_location: number;
    in_radius: number;
}

interface RespondersListProps {
    responders: Responder[];
    selectedResponder: Responder | null;
    onSelectResponder: (responder: Responder) => void;
    onConfirmDispatch: () => void;
    isLoading: boolean;
    isLoadingResponders: boolean;
    diagnostics: AvailabilityDiagnostics | null;
}

// Status badge colors
const statusColors: Record<string, string> = {
    idle: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    busy: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
};

export default function RespondersList({
    responders,
    selectedResponder,
    onSelectResponder,
    onConfirmDispatch,
    isLoading,
    isLoadingResponders,
    diagnostics,
}: RespondersListProps) {
    const closestResponder = responders.length > 0 ? responders[0] : null;

    return (
        <div className="bg-white rounded-xl h-full flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-xl p-3 border-b border-gray-200 z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Available Responders</h2>
                    <p className="text-sm text-gray-600">
                        {isLoadingResponders ? 'Loading...' : `${responders.length} responder(s) available`}
                    </p>
                </div>

                {/* Confirm Dispatch Button */}
                <button
                    onClick={onConfirmDispatch}
                    disabled={!selectedResponder || isLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                        selectedResponder && !isLoading
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isLoading ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
            </div>

            {/* Responders List */}
            <div className="flex-1 overflow-y-auto p-3 max-h-[calc(60vh-140px)]">
                {isLoadingResponders ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading responders...</p>
                        </div>
                    </div>
                ) : responders.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🚑</div>
                            <p className="text-gray-600 text-lg font-medium">No Available Responders</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Please ensure responders are on duty and have location enabled.
                            </p>
                            {diagnostics && diagnostics.total_responders > 0 && (
                                <div className="mt-4 text-left bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                    <p className="font-semibold mb-1">Availability breakdown:</p>
                                    <ul className="space-y-0.5">
                                        <li>{diagnostics.total_responders} total responder(s)</li>
                                        <li>{diagnostics.verified} email verified</li>
                                        <li>{diagnostics.on_duty} on duty</li>
                                        <li>{diagnostics.idle} idle (not busy)</li>
                                        <li>{diagnostics.with_location} with GPS location</li>
                                        <li>{diagnostics.in_radius} within 3km radius</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {responders.map((responder, index) => {
                            const isSelected = selectedResponder?.id === responder.id;
                            const isClosest = closestResponder?.id === responder.id;

                            return (
                                <div
                                    key={responder.id}
                                    className={`p-3 rounded-lg border-2 transition cursor-pointer relative ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                    onClick={() => onSelectResponder(responder)}
                                >
                                    {/* Selection checkmark */}
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between">
                                        {/* Left: Responder Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                                                    {responder.name.charAt(0).toUpperCase()}
                                                </div>

                                                {/* Name and Status */}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {responder.name}
                                                        </h3>
                                                        {isClosest && (
                                                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                                                NEAREST
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                                            statusColors[responder.responder_status] ||
                                                            statusColors.offline
                                                        }`}
                                                    >
                                                        {responder.responder_status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="text-sm text-gray-600 space-y-1 ml-12">
                                                <div>📱 {responder.phone_number}</div>
                                                <div>✉️ {responder.email}</div>
                                            </div>
                                        </div>

                                        {/* Right: Distance & ETA */}
                                        <div className="text-right ml-4">
                                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                                {responder.distance_text}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                ETA: {responder.duration_text}
                                            </div>
                                            {responder.location_updated_at && (
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Updated{' '}
                                                    {formatDistanceToNow(new Date(responder.location_updated_at), {
                                                        addSuffix: true,
                                                    })}
                                                </div>
                                            )}
                                            {responder.distance_method === 'haversine' && (
                                                <div className="text-xs text-amber-600 mt-1">
                                                    ⚠️ Est. distance
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Select Button */}
                                    <div className="mt-3">
                                        <button
                                            className={`w-full py-2 px-4 rounded-md font-medium transition ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {isSelected ? '✓ Selected' : 'Select Responder'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
