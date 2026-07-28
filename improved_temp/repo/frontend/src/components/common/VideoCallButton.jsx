import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import VideoCall from './VideoCall';

/**
 * Premium "Start Video Call" button that opens a Jitsi video-call modal.
 *
 * Props:
 *  - doctorId    (string|number) — used to build a unique room name
 *  - doctorName  (string)        — display name for the doctor
 *  - patientName (string)        — display name for the current user
 */
export default function VideoCallButton({ doctorId, doctorName, patientName }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const roomRef = useRef('');

  const startCall = useCallback(() => {
    // Generate a unique room name per session
    roomRef.current = `qcare-consult-${doctorId}-${Date.now()}`;
    setIsCallActive(true);
  }, [doctorId]);

  const endCall = useCallback(() => {
    setIsCallActive(false);
  }, []);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={startCall}
        className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white
                   bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-emerald-500/25
                   hover:from-green-400 hover:to-emerald-500 hover:shadow-emerald-500/40
                   transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        aria-label={`Start video call with ${doctorName}`}
      >
        {/* Pulsing availability dot */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border-2 border-white" />
        </span>

        <Video className="h-4.5 w-4.5" />
        <span>Start Video Call</span>
      </motion.button>

      {isCallActive && (
        <VideoCall
          roomName={roomRef.current}
          displayName={patientName || 'Patient'}
          onClose={endCall}
        />
      )}
    </>
  );
}
