import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hash, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParty } from '@/hooks/useParty';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface JoinPartyModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function JoinPartyModal({ open, onClose, userId }: JoinPartyModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { joinParty } = useParty();
  const navigate = useNavigate();

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      setError('Party code must be 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: joinError } = await joinParty(trimmedCode, userId);

    if (joinError || !data) {
      setError(joinError?.message || 'Party not found. Check the code and try again.');
      setLoading(false);
      return;
    }

    onClose();
    navigate(`/watch/${data.id}`);
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#161b27] border-white/10 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <Hash className="w-4 h-4 text-violet-400" />
            </div>
            Join a Party
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-white/50">
              Enter the 6-character party code shared by your host.
            </p>

            {/* Code input with individual character boxes */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Enter party code (e.g. ABC123)"
                  value={code}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setCode(val);
                    setError('');
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className={cn(
                    'text-center text-2xl font-mono tracking-[0.5em] h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 placeholder:tracking-normal placeholder:text-sm focus:border-violet-500 uppercase',
                    error && 'border-red-500/50'
                  )}
                  maxLength={6}
                />
              </div>

              {/* Character indicator boxes */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-1.5 rounded-full transition-all',
                      i < code.length ? 'bg-violet-500' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={handleJoin}
              disabled={loading || code.length < 6}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Party'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
