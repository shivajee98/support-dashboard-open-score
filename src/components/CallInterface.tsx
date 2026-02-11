import { useState, useEffect, useRef } from 'react';
import { createEcho } from '@/lib/echo';
import { Phone, PhoneOff, Mic, MicOff, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface CallInterfaceProps {
    partnerId: number; // User to call
    partnerName: string;
    authToken: string;
    agentId: number;
    onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function CallInterface({ partnerId, partnerName, authToken, agentId, onClose }: CallInterfaceProps) {
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const echoRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Echo
        const echo = createEcho(authToken);
        echoRef.current = echo;

        // Listen to MY private channel for answers and candidates
        echo.private(`App.Models.User.${agentId}`)
            .listen('.CallAnswered', async (e: any) => {
                console.log('Call Answered:', e);
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(e.answer));
                    setCallStatus('connected');
                    startTimer();
                }
            })
            .listen('.IceCandidate', async (e: any) => {
                console.log('ICE Candidate received:', e);
                if (peerConnection.current) {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(e.candidate));
                }
            })
            .listen('.EndCall', () => {
                console.log('Call Ended by peer');
                toast.info('Call ended by user');
                endCall(false);
            });

        // Start call logic
        startCall();

        return () => {
            endCall(true);
            if (echoRef.current) {
                echoRef.current.leave(`App.Models.User.${agentId}`);
            }
        };
    }, []);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const startCall = async () => {
        setCallStatus('calling');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (localAudioRef.current) localAudioRef.current.srcObject = stream;

            // Create Peer Connection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                ]
            });

            // Add local tracks
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Handle remote tracks
            pc.ontrack = (event) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE Candidate to:', partnerId);
                    apiFetch('/call/ice-candidate', {
                        method: 'POST',
                        body: JSON.stringify({
                            candidate: event.candidate,
                            to: partnerId
                        })
                    }).catch(err => console.error('ICE Candidate failed:', err));
                }
            };

            peerConnection.current = pc;

            // Create Offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send offer via API
            console.log('Initiating call to:', partnerId);
            await apiFetch('/call/initiate', {
                method: 'POST',
                body: JSON.stringify({
                    offer,
                    to: partnerId
                })
            });

        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Failed to access microphone or start call');
            onClose();
        }
    };

    const endCall = async (notifyPeer = true) => {
        if (notifyPeer && callStatus !== 'ended') {
            try {
                await apiFetch('/call/end', {
                    method: 'POST',
                    body: JSON.stringify({ to: partnerId })
                });
            } catch (e) { console.error(e); }
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Stop local stream
        if (localAudioRef.current && localAudioRef.current.srcObject) {
            const stream = localAudioRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        if (timerRef.current) clearInterval(timerRef.current);
        setCallStatus('ended');
        setTimeout(onClose, 2000); // Close modal after delay
    };

    const toggleMute = () => {
        if (localAudioRef.current && localAudioRef.current.srcObject) {
            const stream = localAudioRef.current.srcObject as MediaStream;
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative overflow-hidden text-center">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-b-[50%] opacity-10"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner border-4 border-white">
                        <User size={40} className="text-slate-400" />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-1">{partnerName}</h3>

                    <div className="h-8 mb-8">
                        {callStatus === 'calling' && (
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest animate-pulse">Calling...</p>
                        )}
                        {callStatus === 'connected' && (
                            <p className="text-lg font-mono font-bold text-slate-700">{formatTime(callDuration)}</p>
                        )}
                        {callStatus === 'ended' && (
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Call Ended</p>
                        )}
                    </div>

                    <div className="flex justify-center gap-6">
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full transition-all active:scale-95 shadow-lg ${isMuted ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-800'}`}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>

                        <button
                            onClick={() => endCall(true)}
                            className="p-4 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-500/30"
                            title="End Call"
                        >
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </div>

                {/* Hidden Audio Elements */}
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />
            </div>
        </div>
    );
}
