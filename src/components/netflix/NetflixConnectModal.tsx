import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNetflixAuth } from '@/hooks/useNetflixAuth';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Monitor,
  ArrowRight,
  User,
} from 'lucide-react';

interface NetflixConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (profileName: string) => void;
}

const NetflixLogo = () => (
  <svg viewBox="0 0 111 30" className="h-8 w-auto" fill="#E50914">
    <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.031-13.75L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.25V0zm-8.937 26.937c-4.078-.313-8.156-.5-12.297-.5V0h4.687v22.78c2.562.094 5.156.282 7.61.438v3.72zM64.375 10.656v3.595h-6.719V26.5h-4.656V0H64.75v3.625h-7.094v7.031h6.719zm-18.906-7.03h-4.844V27.75c1.563 0 3.156.031 4.719.063L45.469 3.625zM35.875 0h-4.656l-.031 19.625c-2-.313-3.969-.563-5.969-.782V0H20.5v22.594c4.25.532 8.438 1.282 12.563 2.156V0h2.812zm-18.313 22.28C12.218 21.656 6.75 21.28.999 21.28V0H5.62v17.875c3.625.125 7.188.5 10.719 1.063l1.223 3.342z" />
  </svg>
);

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? 'w-6 bg-[#E50914]' : i === current ? 'w-8 bg-[#E50914]' : 'w-4 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

export function NetflixConnectModal({
  open,
  onOpenChange,
  onConnected,
}: NetflixConnectModalProps) {
  const { step, error, profileName, startAuth, confirmLogin, cancelAuth, resetAuth, setProfileName, popupWasClosed } =
    useNetflixAuth(onConnected);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      resetAuth();
    }
  }, [open, resetAuth]);

  const handleClose = () => {
    cancelAuth();
    onOpenChange(false);
  };

  const stepIndex =
    step === 'idle' ? 0
    : step === 'checking' ? 1
    : step === 'popup-open' ? 1
    : step === 'popup-closed' ? 2
    : step === 'confirming' ? 2
    : step === 'success' ? 3
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-[#141414] border-[#2a2a2a] text-white p-0 overflow-hidden">
        {/* Header stripe */}
        <div className="h-1 bg-[#E50914]" />

        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <NetflixLogo />
              {step !== 'idle' && step !== 'error' && step !== 'success' && (
                <StepIndicator current={stepIndex} total={3} />
              )}
            </div>
            <DialogTitle className="text-xl font-bold text-white text-left">
              {step === 'success' ? 'Netflix Connected!' : 'Connect Your Netflix Account'}
            </DialogTitle>
            <DialogDescription className="text-[#a3a3a3] text-left text-sm">
              {step === 'success'
                ? 'You can now create and join Netflix watch rooms.'
                : 'Sign in with your real Netflix account to enable watch rooms — just like the HEARO app.'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* IDLE — explain the flow */}
            {step === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  {[
                    {
                      icon: <ExternalLink className="w-4 h-4 text-[#E50914]" />,
                      title: "Netflix's real login page opens",
                      desc: 'A secure popup window will open Netflix.com — not a fake form.',
                    },
                    {
                      icon: <User className="w-4 h-4 text-[#E50914]" />,
                      title: 'Sign in directly on Netflix',
                      desc: 'Enter your Netflix credentials on Netflix\'s own login page.',
                    },
                    {
                      icon: <Monitor className="w-4 h-4 text-[#E50914]" />,
                      title: 'Return here to create rooms',
                      desc: 'Once logged in on Netflix, come back and confirm.',
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="mt-0.5 shrink-0">{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300">
                    Make sure popups are allowed for this site. We never store your Netflix password.
                  </p>
                </div>

                <Button
                  variant="netflix"
                  className="w-full font-semibold gap-2"
                  onClick={startAuth}
                >
                  Open Netflix Login
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* CHECKING — verifying reachability */}
            {step === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
                <p className="text-sm text-[#a3a3a3]">Connecting to Netflix…</p>
              </motion.div>
            )}

            {/* POPUP OPEN — waiting for user to log in */}
            {step === 'popup-open' && (
              <motion.div
                key="popup-open"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-[#E50914]/20 flex items-center justify-center">
                      <ExternalLink className="w-7 h-7 text-[#E50914]" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-black animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Netflix login popup is open</p>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Sign in to Netflix in the popup window, then come back here.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Steps:</p>
                  <ol className="space-y-1.5">
                    {[
                      'Enter your Netflix email & password',
                      'Complete any 2-factor verification',
                      'Once on Netflix home, close the popup',
                      'Click "I\'ve Logged In" below',
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
                        <span className="w-5 h-5 rounded-full bg-[#E50914]/30 text-[#E50914] text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={cancelAuth}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="netflix"
                    className="flex-1 font-semibold"
                    onClick={popupWasClosed}
                  >
                    I've Logged In
                  </Button>
                </div>
              </motion.div>
            )}

            {/* POPUP CLOSED / CONFIRMING — confirm and enter profile name */}
            {(step === 'popup-closed' || step === 'confirming') && (
              <motion.div
                key="confirming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="w-14 h-14 rounded-full bg-[#E50914]/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#E50914]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Did you log in successfully?</p>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Enter your Netflix profile name to confirm.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-white/80 text-sm">
                    Netflix Profile Name
                  </Label>
                  <Input
                    id="profile-name"
                    placeholder="e.g. John, or your profile nickname"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#E50914]"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && confirmLogin(profileName)}
                  />
                  <p className="text-xs text-[#a3a3a3]">
                    This is the name on your Netflix profile — used to identify you in watch rooms.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      cancelAuth();
                      startAuth();
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="netflix"
                    className="flex-1 font-semibold"
                    onClick={() => confirmLogin(profileName)}
                    disabled={!profileName.trim()}
                  >
                    Confirm Connection
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center gap-4 py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">Welcome, {profileName}!</p>
                    <p className="text-sm text-[#a3a3a3] mt-1">
                      Netflix account connected. You can now create watch rooms.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-300">
                    Netflix profile <span className="font-semibold">"{profileName}"</span> is ready for watch rooms.
                  </p>
                </div>

                <Button
                  variant="netflix"
                  className="w-full font-semibold"
                  onClick={() => onOpenChange(false)}
                >
                  Start Watching Together
                </Button>
              </motion.div>
            )}

            {/* ERROR */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center gap-3 py-4">
                  <XCircle className="w-12 h-12 text-red-400" />
                  <div className="text-center">
                    <p className="text-white font-semibold">Connection Failed</p>
                    {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button variant="netflix" className="flex-1" onClick={resetAuth}>
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
