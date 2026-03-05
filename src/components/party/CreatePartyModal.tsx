import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv2, Link as LinkIcon, Loader2, Copy, Check, Youtube, Film } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParty } from '@/hooks/useParty';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CreatePartyModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function CreatePartyModal({ open, onClose, userId }: CreatePartyModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdPartyId, setCreatedPartyId] = useState('');

  const { createParty } = useParty();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a party name.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: createError } = await createParty(name.trim(), videoUrl.trim(), userId);

    if (createError || !data) {
      setError(createError?.message || 'Failed to create party. Try again.');
      setLoading(false);
      return;
    }

    setCreatedCode(data.party_code);
    setCreatedPartyId(data.id);
    setStep(2);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    onClose();
    navigate(`/watch/${createdPartyId}`);
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setVideoUrl('');
    setError('');
    setCreatedCode('');
    onClose();
  };

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-[#161b27] border-white/10 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <Tv2 className="w-4 h-4 text-violet-400" />
            </div>
            Create a Party
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6">
          {step === 1 ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label className="text-white/70">Party Name *</Label>
                <Input
                  placeholder="Movie Night with Friends"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-violet-500"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Video URL (optional)</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {isYouTube ? (
                      <Youtube className="w-4 h-4 text-red-400" />
                    ) : videoUrl ? (
                      <Film className="w-4 h-4 text-violet-400" />
                    ) : (
                      <LinkIcon className="w-4 h-4 text-white/30" />
                    )}
                  </div>
                  <Input
                    placeholder="YouTube URL or direct video link"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-violet-500"
                  />
                </div>
                <p className="text-xs text-white/30">
                  Supports YouTube, MP4, and other direct video links. You can add this later.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Party'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto">
                  <Tv2 className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Party Created!</h3>
                <p className="text-sm text-white/50">Share this code with friends to join</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Party Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold tracking-[0.3em] text-white font-mono">
                    {createdCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  onClick={handleJoin}
                >
                  Enter Party
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
