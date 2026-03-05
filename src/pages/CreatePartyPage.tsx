import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePartyStore } from '@/store/partyStore';
import { useAuthStore } from '@/store/authStore';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  ArrowLeft, ArrowRight, Check, Film, Music, Monitor,
  Users, Lock, Globe, Sparkles, Copy, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const mediaTypes = [
  { id: 'video', label: 'Video / Movie', icon: Film, desc: 'Watch movies, shows, or videos together' },
  { id: 'music', label: 'Music', icon: Music, desc: 'Listen to music together' },
  { id: 'screen', label: 'Screen Share', icon: Monitor, desc: 'Share your screen with the party' },
];

export default function CreatePartyPage() {
  const [step, setStep] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [codeCopied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    media_type: 'video' as 'video' | 'music' | 'screen',
    media_title: '',
    media_url: '',
    max_members: 20,
    is_private: false,
    genre: '',
  });

  const { user, isAuthenticated } = useAuthStore();
  const { createParty, currentParty } = usePartyStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Create a Watch Party</h1>
          <p className="text-gray-400 mb-8">Sign in to create and host your own watch party</p>
          <Button onClick={() => setAuthOpen(true)} size="lg">Sign In to Continue</Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const handleCreate = () => {
    const party = createParty({
      ...form,
      host_id: user!.id,
      host_name: user!.username,
    });
    setStep(3);
  };

  const copyCode = () => {
    if (currentParty) {
      navigator.clipboard.writeText(currentParty.code);
      setCopied(true);
      toast.success('Party code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = ['Type', 'Details', 'Settings'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Progress */}
        {step < 3 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i <= step ? 'gradient-primary text-white' : 'bg-secondary text-gray-500'
                  }`}>
                    {i < step ? <Check className="w-5 h-5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-20 sm:w-32 h-0.5 mx-2 transition-all ${
                      i < step ? 'bg-primary' : 'bg-secondary'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {step === 0 && 'What type of party?'}
              {step === 1 && 'Party Details'}
              {step === 2 && 'Party Settings'}
            </h2>
          </div>
        )}

        {/* Step 0: Type */}
        {step === 0 && (
          <div className="space-y-4">
            {mediaTypes.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setForm({ ...form, media_type: id as any })}
                className={`w-full glass rounded-2xl p-6 flex items-center gap-4 text-left transition-all ${
                  form.media_type === id ? 'ring-2 ring-primary glow' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  form.media_type === id ? 'gradient-primary' : 'bg-secondary'
                }`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{label}</h3>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(1)} className="gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Party Name</label>
              <Input
                placeholder="e.g. Friday Movie Night"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
              <Input
                placeholder="What's this party about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                {form.media_type === 'music' ? 'Track / Album' : 'What are you watching?'}
              </label>
              <Input
                placeholder={form.media_type === 'music' ? 'e.g. Lo-Fi Chill Beats' : 'e.g. Interstellar'}
                value={form.media_title}
                onChange={(e) => setForm({ ...form, media_title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Media URL (optional)</label>
              <Input
                placeholder="Paste a video or stream URL"
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Genre</label>
              <div className="flex flex-wrap gap-2">
                {['Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Anime', 'Music', 'Documentary', 'Action'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm({ ...form, genre: form.genre === g ? '' : g })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      form.genre === g
                        ? 'bg-primary text-white'
                        : 'glass-light text-gray-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(0)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={!form.name} className="gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Max Members</label>
              <div className="flex gap-2">
                {[10, 20, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, max_members: n })}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      form.max_members === n
                        ? 'gradient-primary text-white'
                        : 'glass-light text-gray-400 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">Privacy</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm({ ...form, is_private: false })}
                  className={`glass rounded-xl p-4 text-left transition-all ${
                    !form.is_private ? 'ring-2 ring-primary glow' : 'hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="font-medium text-white">Public</h4>
                  <p className="text-xs text-gray-400">Anyone can discover and join</p>
                </button>
                <button
                  onClick={() => setForm({ ...form, is_private: true })}
                  className={`glass rounded-xl p-4 text-left transition-all ${
                    form.is_private ? 'ring-2 ring-primary glow' : 'hover:bg-white/5'
                  }`}
                >
                  <Lock className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-medium text-white">Private</h4>
                  <p className="text-xs text-gray-400">Only people with the code can join</p>
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleCreate} className="gap-2">
                <Sparkles className="w-4 h-4" /> Create Party
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Created */}
        {step === 3 && currentParty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Party Created!</h2>
            <p className="text-gray-400 mb-8">Share the code with your friends</p>

            <div className="glass rounded-2xl p-6 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-gray-400 mb-2">Party Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-widest gradient-text">
                  {currentParty.code}
                </span>
                <Button variant="ghost" size="icon" onClick={copyCode}>
                  {codeCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate(`/watch/${currentParty.id}`)} className="gap-2">
                Enter Party <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => { setStep(0); setForm({ name: '', description: '', media_type: 'video', media_title: '', media_url: '', max_members: 20, is_private: false, genre: '' }); }}>
                Create Another
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
