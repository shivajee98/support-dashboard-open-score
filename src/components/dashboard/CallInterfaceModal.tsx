import CallInterface from '@/components/CallInterface';
import { User } from '@/components/dashboard/types';

interface CallInterfaceModalProps {
    activeCall: any;
    currentUser: User;
    onClose: () => void;
}

export default function CallInterfaceModal({ activeCall, currentUser, onClose }: CallInterfaceModalProps) {
    if (!activeCall) return null;

    return (
        <CallInterface
            partnerId={activeCall.userId}
            partnerName={activeCall.name}
            authToken={localStorage.getItem('token') || ''}
            agentId={currentUser?.id}
            onClose={onClose}
        />
    );
}
