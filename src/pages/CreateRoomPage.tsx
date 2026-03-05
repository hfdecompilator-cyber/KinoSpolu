import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Lock,
  Globe,
  Users,
  Film,
  Link,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type { Room, User } from '@/types';

interface CreateRoomPageProps {
  user: User;
  onCreateRoom: (params: {
    name: string;
    contentTitle: string;
    contentUrl: string;
    maxParticipants: number;
    isPrivate: boolean;
    username: string;
  }) => Promise<Room | null>;
  onBack: () => void;
  onRoomCreated: (room: Room) => void;
}

const POPULAR_TITLES = [
  { title: 'Stranger Things', url: 'https://www.netflix.com/title/80057281' },
  { title: 'Wednesday', url: 'https://www.netflix.com/title/81231974' },
  { title: 'The Crown', url: 'https://www.netflix.com/title/80025678' },
  { title: 'Squid Game', url: 'https://www.netflix.com/title/81040344' },
  { title: 'Black Mirror', url: 'https://www.netflix.com/title/70264888' },
  { title: 'Bridgerton', url: 'https://www.netflix.com/title/80232398' },
];

type Step = 1 | 2 | 3;

export function CreateRoomPage({ user, onCreateRoom, onBack, onRoomCreated }: CreateRoomPageProps) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectTitle = (t: { title: string; url: string }) => {
    setContentTitle(t.title);
    setContentUrl(t.url);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError('Room name is required.');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      setError('');
      setStep(3);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const room = await onCreateRoom({
      name: name.trim(),
      contentTitle: contentTitle.trim(),
      contentUrl: contentUrl.trim(),
      maxParticipants,
      isPrivate,
      username: user.username || user.email.split('@')[0],
    });
    setLoading(false);
    if (room) {
      setCreatedRoom(room);
    } else {
      setError('Failed to create room. Please try again.');
    }
  };

  const copyCode = () => {
    if (createdRoom?.code) {
      navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdRoom) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-[#141414] border-[#2a2a2a] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#E50914] to-[#7c3aed]" />
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1">Room Created!</h2>
                <p className="text-[#a3a3a3] text-sm">{createdRoom.name}</p>
              </div>

              {/* Room code */}
              <div className="mb-6">
                <Label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">
                  Room Code
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-center bg-white/10 rounded-xl border border-white/20 py-4">
                    <span className="text-3xl font-black text-white tracking-[0.2em] font-mono">
                      {createdRoom.code}
                    </span>
                  </div>
                  <button
                    onClick={copyCode}
                    className={`p-3 rounded-xl border transition-all ${
                      copied
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/10 border-white/20 text-white/60 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#a3a3a3] mt-2 text-center">
                  Share this code with friends to join your room
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
                {[
                  { label: 'Content', value: createdRoom.contentTitle || 'Not specified' },
                  { label: 'Capacity', value: `${createdRoom.maxParticipants} participants` },
                  {
                    label: 'Privacy',
                    value: createdRoom.isPrivate ? 'Private' : 'Public',
                  },
                  { label: 'Host', value: createdRoom.hostUsername },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[#a3a3a3]">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={onBack}
                >
                  Dashboard
                </Button>
                <Button
                  className="flex-1 bg-[#E50914] hover:bg-[#B20710] gap-1.5"
                  onClick={() => onRoomCreated(createdRoom)}
                >
                  Enter Room
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4">
      <div className="max-w-lg mx-auto pt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Create Netflix Room</h1>
          <p className="text-[#a3a3a3] text-sm">
            Hosting as{' '}
            <span className="text-[#E50914] font-medium">
              {user.netflixProfileName || user.username}
            </span>
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < step
                    ? 'bg-emerald-500 text-white'
                    : n === step
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {n < step ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  n === step ? 'text-white' : 'text-white/40'
                }`}
              >
                {n === 1 ? 'Room Setup' : n === 2 ? 'What to Watch' : 'Review'}
              </span>
              {n < 3 && <div className="flex-1 h-px bg-white/10 mx-2" />}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#141414] border-[#2a2a2a]">
            <CardContent className="p-6 space-y-5">
              {step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-white/80 text-sm">Room Name *</Label>
                    <Input
                      placeholder="Friday Night Movies"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#E50914]"
                      maxLength={50}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleNext()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Max Participants</Label>
                    <div className="flex gap-2">
                      {[2, 4, 6, 8, 10].map(n => (
                        <button
                          key={n}
                          onClick={() => setMaxParticipants(n)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                            maxParticipants === n
                              ? 'bg-[#E50914] border-[#E50914] text-white'
                              : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Privacy</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: true,
                          icon: <Lock className="w-4 h-4" />,
                          label: 'Private',
                          desc: 'Invite only via code',
                        },
                        {
                          value: false,
                          icon: <Globe className="w-4 h-4" />,
                          label: 'Public',
                          desc: 'Anyone can find & join',
                        },
                      ].map(opt => (
                        <button
                          key={String(opt.value)}
                          onClick={() => setIsPrivate(opt.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isPrivate === opt.value
                              ? 'bg-[#E50914]/15 border-[#E50914]/40'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className={`mb-1 ${
                              isPrivate === opt.value ? 'text-[#E50914]' : 'text-white/50'
                            }`}
                          >
                            {opt.icon}
                          </div>
                          <p className="text-sm font-medium text-white">{opt.label}</p>
                          <p className="text-xs text-[#a3a3a3]">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label className="text-white/80 text-sm mb-3 block">
                      Popular on Netflix
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_TITLES.map(t => (
                        <button
                          key={t.title}
                          onClick={() => handleSelectTitle(t)}
                          className={`p-2.5 rounded-lg border text-left text-sm transition-all ${
                            contentTitle === t.title
                              ? 'bg-[#E50914]/15 border-[#E50914]/40 text-white'
                              : 'bg-white/5 border-white/10 text-[#a3a3a3] hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs text-white/40">or enter manually</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Title Name</Label>
                      <Input
                        placeholder="Show or movie title"
                        value={contentTitle}
                        onChange={e => setContentTitle(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#E50914] text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">
                        <Link className="w-3 h-3 inline mr-1" />
                        Netflix URL (optional)
                      </Label>
                      <Input
                        placeholder="https://www.netflix.com/watch/..."
                        value={contentUrl}
                        onChange={e => setContentUrl(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#E50914] text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-sm">Review your room</h3>

                  <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
                    {[
                      { label: 'Room Name', value: name },
                      { label: 'Content', value: contentTitle || 'Not specified' },
                      { label: 'Max Participants', value: `${maxParticipants} people` },
                      { label: 'Privacy', value: isPrivate ? '🔒 Private' : '🌐 Public' },
                      {
                        label: 'Host (Netflix)',
                        value: user.netflixProfileName || user.username || 'You',
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                        <span className="text-[#a3a3a3]">{label}</span>
                        <span className="text-white font-medium text-right max-w-[200px] truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {contentUrl && (
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[#E50914] hover:text-[#ff6b6b] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open on Netflix to verify
                    </a>
                  )}

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    All participants need their own Netflix account to watch. The room code will
                    be shared after creation.
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep((s => (s - 1) as Step)(step))}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    className="flex-1 bg-[#E50914] hover:bg-[#B20710] font-semibold gap-2"
                    onClick={handleNext}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-[#E50914] hover:bg-[#B20710] font-semibold gap-2"
                    onClick={handleCreate}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Room
                        <Users className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
