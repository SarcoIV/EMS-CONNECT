import { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { CreateIncidentModal } from './CreateIncidentModal';

interface Caller {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
}

interface Incident {
    id: number;
    type: string;
    location: any;
    description: string;
}

interface IncomingCall {
    id: number;
    incident_id: number | null;
    channel_name: string;
    caller: Caller;
    status: string;
    started_at: string;
    incident: Incident | null;
}

const POLL_INTERVAL = 3000; // Poll every 3 seconds

export function IncomingCallNotification() {
    const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
    const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isJoining, setIsJoining] = useState(false);
    const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);

    const agoraClient = useRef<IAgoraRTCClient | null>(null);
    const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const durationInterval = useRef<NodeJS.Timeout | null>(null);

    // Initialize Agora client
    useEffect(() => {
        agoraClient.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
        });

        // Register event handlers
        agoraClient.current.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            await agoraClient.current!.subscribe(user, mediaType);
            console.log('👤 User joined and published:', user.uid);

            if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack?.play();
            }
        });

        agoraClient.current.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
            console.log('👤 User unpublished:', user.uid);
        });

        agoraClient.current.on('user-left', (user: IAgoraRTCRemoteUser) => {
            console.log('👤 User left:', user.uid);
        });

        return () => {
            // Cleanup
            if (agoraClient.current) {
                agoraClient.current.leave();
                agoraClient.current.removeAllListeners();
            }
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, []);

    // Poll for incoming calls
    useEffect(() => {
        const fetchIncomingCalls = async () => {
            try {
                console.log('[CALLS] 🔍 Polling for incoming calls...');
                const response = await axios.get('/admin/calls/incoming');
                const calls = response.data.calls || [];
                
                if (calls.length > 0) {
                    console.log('[CALLS] 🔔 INCOMING CALLS DETECTED:', calls.length);
                    calls.forEach((call: IncomingCall) => {
                        console.log('[CALLS] 📞 Call details:', {
                            id: call.id,
                            caller: call.caller.name,
                            email: call.caller.email,
                            channel: call.channel_name,
                            status: call.status,
                            started_at: call.started_at,
                        });
                    });
                } else {
                    console.log('[CALLS] No incoming calls');
                }
                
                setIncomingCalls(calls);
            } catch (error) {
                console.error('[CALLS] ❌ Failed to fetch incoming calls:', error);
            }
        };

        console.log('[CALLS] 🚀 Starting incoming call polling (every 3 seconds)');
        
        // Initial fetch
        fetchIncomingCalls();

        // Set up polling
        pollInterval.current = setInterval(fetchIncomingCalls, POLL_INTERVAL);

        return () => {
            console.log('[CALLS] 🛑 Stopping incoming call polling');
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, []);

    // Call duration timer
    useEffect(() => {
        if (isInCall) {
            durationInterval.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
            setCallDuration(0);
        }

        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, [isInCall]);

    // Close incident form when call ends (from either side)
    useEffect(() => {
        if (!activeCall && showCreateIncidentModal) {
            console.log('[CALLS] 📝 Closing incident form - call ended');
            setShowCreateIncidentModal(false);
        }
    }, [activeCall, showCreateIncidentModal]);

    // Answer call
    const handleAnswerCall = async (call: IncomingCall) => {
        try {
            console.log('[CALLS] 📲 Answering call:', {
                call_id: call.id,
                caller: call.caller.name,
                channel: call.channel_name,
            });

            setIsJoining(true);
            setActiveCall(call);

            // Call backend to mark as answered
            const response = await axios.post('/admin/calls/answer', {
                call_id: call.id,
            });

            console.log('[CALLS] ✅ Call answered successfully:', response.data);

            // Extract Agora App ID from response
            const { agora_app_id } = response.data;

            // Join Agora channel
            if (agoraClient.current) {
                await agoraClient.current.join(
                    agora_app_id,
                    call.channel_name,
                    null, // token (null for App ID only mode)
                    null  // uid (null for auto-assign)
                );

                // Create and publish local audio track
                localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
                await agoraClient.current.publish([localAudioTrack.current]);

                console.log('[CALLS] ✅ Joined Agora channel:', call.channel_name);
                setIsInCall(true);
                setIsJoining(false);

                // Remove from incoming calls list
                setIncomingCalls((prev) => prev.filter((c) => c.id !== call.id));

                // ALWAYS AUTO-OPEN INCIDENT FORM when call is answered
                console.log('[CALLS] 📝 Auto-opening incident form');
                setShowCreateIncidentModal(true);
            }
        } catch (error) {
            console.error('[CALLS] ❌ Failed to answer call:', error);
            setIsJoining(false);
            setActiveCall(null);
            alert('Failed to answer call. Please try again.');
        }
    };

    // End call
    const handleEndCall = async () => {
        try {
            if (activeCall) {
                // End call on backend
                await axios.post('/admin/calls/end', {
                    call_id: activeCall.id,
                });

                // Leave Agora channel
                if (localAudioTrack.current) {
                    localAudioTrack.current.stop();
                    localAudioTrack.current.close();
                    localAudioTrack.current = null;
                }

                if (agoraClient.current) {
                    await agoraClient.current.leave();
                }

                console.log('[CALLS] 🔴 Call ended');
            }
        } catch (error) {
            console.error('[CALLS] ❌ Failed to end call:', error);
        } finally {
            setIsInCall(false);
            setActiveCall(null);
            setIsMuted(false);
            setCallDuration(0);
            setShowCreateIncidentModal(false); // Close incident form when call ends
        }
    };

    // Reject call
    const handleRejectCall = async (call: IncomingCall) => {
        try {
            await axios.post('/admin/calls/end', {
                call_id: call.id,
            });
            setIncomingCalls((prev) => prev.filter((c) => c.id !== call.id));
        } catch (error) {
            console.error('[CALLS] ❌ Failed to reject call:', error);
        }
    };

    // Toggle mute
    const handleToggleMute = async () => {
        if (localAudioTrack.current) {
            await localAudioTrack.current.setEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Incoming Call Notification */}
            {incomingCalls.length > 0 && !isInCall && !activeCall && (
                <div className="fixed right-4 top-20 z-50 animate-bounce">
                    {incomingCalls.map((call) => (
                        <div
                            key={call.id}
                            className="mb-3 w-80 rounded-lg bg-red-600 p-4 text-white shadow-2xl"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 animate-pulse rounded-full bg-white"></div>
                                    <span className="font-bold">Emergency Call</span>
                                </div>
                            </div>

                            <div className="mb-3 space-y-1">
                                <p className="text-sm font-semibold">{call.caller.name}</p>
                                <p className="text-xs opacity-90">{call.caller.email}</p>
                                {call.incident && (
                                    <p className="text-xs opacity-90">
                                        Type: {call.incident.type.toUpperCase()}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAnswerCall(call)}
                                    className="flex-1 rounded bg-green-500 py-2 text-sm font-bold hover:bg-green-600"
                                >
                                    Answer
                                </button>
                                <button
                                    onClick={() => handleRejectCall(call)}
                                    className="flex-1 rounded bg-gray-700 py-2 text-sm font-bold hover:bg-gray-800"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Call Modal */}
            {(isInCall || isJoining) && activeCall && (
                <>
                    {/* Compact Call Widget (shown when incident form is open) */}
                    {showCreateIncidentModal ? (
                        <div className="fixed right-6 top-6 z-[70] w-80 animate-in fade-in slide-in-from-top-5 duration-300">
                            <div className="rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-5 text-white shadow-2xl border border-red-500/20">
                                {/* Header */}
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                                            <p className="text-xs font-medium uppercase tracking-wider opacity-90">
                                                Active Call
                                            </p>
                                        </div>
                                        <p className="mt-0.5 text-lg font-bold">{formatDuration(callDuration)}</p>
                                    </div>
                                </div>

                                {/* Caller Info */}
                                <div className="mb-4 rounded-xl bg-white/10 backdrop-blur-sm p-3">
                                    <p className="text-sm font-semibold">{activeCall.caller.name}</p>
                                    <p className="text-xs opacity-75">{activeCall.caller.email}</p>
                                </div>

                                {/* Controls */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleToggleMute}
                                        className="flex-1 rounded-lg bg-white/15 py-2.5 text-sm font-semibold backdrop-blur-sm hover:bg-white/25 transition-all active:scale-95"
                                    >
                                        {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                                    </button>
                                    <button
                                        onClick={handleEndCall}
                                        className="flex-1 rounded-lg bg-red-900/80 py-2.5 text-sm font-semibold hover:bg-red-950 transition-all active:scale-95"
                                    >
                                        ✕ End Call
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Full-Screen Call Modal (shown when incident form is closed) */
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="w-96 rounded-2xl bg-gradient-to-b from-red-600 to-red-700 p-8 text-white shadow-2xl">
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                                        <svg
                                            className="h-10 w-10"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                                        </svg>
                                    </div>

                                    {isJoining ? (
                                        <>
                                            <h2 className="mb-2 text-2xl font-bold">Connecting...</h2>
                                            <p className="text-sm opacity-90">Please wait</p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="mb-2 text-2xl font-bold">In Call</h2>
                                            <p className="mb-4 text-4xl font-bold">{formatDuration(callDuration)}</p>
                                            <p className="text-lg font-semibold">{activeCall.caller.name}</p>
                                            <p className="text-sm opacity-90">{activeCall.caller.email}</p>
                                            {activeCall.incident && (
                                                <p className="mt-2 text-xs opacity-75">
                                                    Emergency Type: {activeCall.incident.type.toUpperCase()}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {isInCall && (
                                    <>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleToggleMute}
                                                className="flex-1 rounded-lg bg-white/20 py-3 text-sm font-bold backdrop-blur-sm hover:bg-white/30"
                                            >
                                                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                                            </button>
                                            <button
                                                onClick={handleEndCall}
                                                className="flex-1 rounded-lg bg-red-900 py-3 text-sm font-bold hover:bg-red-950"
                                            >
                                                ✕ End Call
                                            </button>
                                        </div>

                                        {/* Create Incident Button (only if no incident linked) */}
                                        {!activeCall.incident_id && (
                                            <button
                                                onClick={() => setShowCreateIncidentModal(true)}
                                                className="mt-3 w-full rounded-lg bg-yellow-500 py-3 text-sm font-bold text-white hover:bg-yellow-600 transition shadow-lg"
                                            >
                                                📝 Create Incident Report
                                            </button>
                                        )}

                                        {/* Show incident info if already linked */}
                                        {activeCall.incident && (
                                            <div className="mt-3 rounded-lg bg-white/20 backdrop-blur-sm p-3 text-sm">
                                                <p className="text-xs opacity-75 mb-1">
                                                    Linked Incident:
                                                </p>
                                                <p className="font-semibold">
                                                    #{activeCall.incident.id} -{' '}
                                                    {activeCall.incident.type.toUpperCase()}
                                                </p>
                                                <a
                                                    href={`/admin/dispatch/${activeCall.incident.id}`}
                                                    className="text-xs underline hover:text-yellow-200 mt-1 inline-block"
                                                >
                                                    View Dispatch →
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Incident Modal */}
            {activeCall && (
                <CreateIncidentModal
                    isOpen={showCreateIncidentModal}
                    onClose={() => setShowCreateIncidentModal(false)}
                    callerId={activeCall.caller.id}
                    callerName={activeCall.caller.name}
                    callId={activeCall.id}
                    existingIncident={activeCall.incident}
                    onIncidentCreated={(incident) => {
                        // Update activeCall with the new incident
                        setActiveCall({
                            ...activeCall,
                            incident_id: incident.id,
                            incident: incident,
                        });
                        setShowCreateIncidentModal(false);
                    }}
                />
            )}
        </>
    );
}
