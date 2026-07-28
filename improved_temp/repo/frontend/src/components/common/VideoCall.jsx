import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Phone, X, Shield } from 'lucide-react';

/**
 * Full-screen Jitsi Meet video-call overlay.
 *
 * Props:
 *  - roomName   (string)   — unique room identifier
 *  - displayName (string)  — name shown inside the call
 *  - onClose    (function) — called when the user leaves the call
 */
export default function VideoCall({ roomName, displayName, onClose }) {
  const iframeRef = useRef(null);

  /* ── Build a safe Jitsi URL ─────────────────────────────── */
  const safeRoom = encodeURIComponent(
    roomName.replace(/[^a-zA-Z0-9_-]/g, '-'),
  );
  const safeName = encodeURIComponent(displayName);
  const jitsiUrl = `https://meet.jit.si/${safeRoom}#userInfo.displayName="${safeName}"&config.prejoinPageEnabled=false`;

  /* ── Keyboard: Esc to leave ────────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  /* ── Overlay variants ──────────────────────────────────── */
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      y: 16,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  };

  /* ── Portal content ────────────────────────────────────── */
  const content = (
    <AnimatePresence>
      <motion.div
        key="video-call-overlay"
        className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-modal="true"
        role="dialog"
        aria-label={`Video call — ${roomName}`}
      >
        {/* ── Glassmorphic header bar ─────────────────────── */}
        <motion.header
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-10 flex items-center justify-between gap-4 px-5 py-3
                     bg-white/10 backdrop-blur-2xl border-b border-white/10 shadow-lg"
        >
          {/* Left: call info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/20 shrink-0">
              <Video className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate font-display">
                {roomName}
              </h2>
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                End-to-end encrypted · Jitsi Meet
              </p>
            </div>
          </div>

          {/* Right: leave button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white
                       bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-600/30
                       hover:from-red-500 hover:to-rose-400 transition-all duration-200"
            aria-label="Leave call"
          >
            <Phone className="h-4 w-4 rotate-[135deg]" />
            <span className="hidden sm:inline">Leave Call</span>
          </motion.button>
        </motion.header>

        {/* ── Jitsi iframe ────────────────────────────────── */}
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            src={jitsiUrl}
            title="Video Consultation"
            className="absolute inset-0 w-full h-full border-0"
            allow="camera; microphone; display-capture; autoplay; clipboard-write"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        </div>

        {/* ── Corner close (mobile-friendly) ──────────────── */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:hidden p-2 rounded-full bg-black/40 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
