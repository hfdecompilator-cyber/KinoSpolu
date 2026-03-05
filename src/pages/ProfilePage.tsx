import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  User, Mail, Calendar, Edit3, Camera, Shield, Bell,
  Palette, LogOut, Sparkles, Save, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isAuthenticated, signOut, updateProfile } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');

  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <User className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Your Profile</h1>
          <p className="text-gray-400 mb-8">Sign in to view and manage your profile</p>
          <Button onClick={() => setAuthOpen(true)} size="lg">Sign In</Button>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const handleSave = () => {
    updateProfile({ username });
    setEditing(false);
    toast.success('Profile updated!');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="relative">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24 ring-4 ring-primary/30">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-2xl">{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {editing ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="max-w-[200px] text-center"
                />
                <Button size="icon" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-white">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="default">Free Plan</Badge>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Parties Joined', value: '12' },
            { label: 'Hours Watched', value: '48' },
            { label: 'Friends', value: '24' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="glass rounded-2xl overflow-hidden">
          <h3 className="text-sm font-medium text-gray-500 px-6 pt-5 pb-2">Settings</h3>
          {[
            { icon: Shield, label: 'Privacy & Security', desc: 'Manage your privacy settings' },
            { icon: Bell, label: 'Notifications', desc: 'Configure notification preferences' },
            { icon: Palette, label: 'Appearance', desc: 'Theme and display settings' },
          ].map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          ))}

          <div className="px-6 py-4 border-t border-white/5">
            <Button variant="destructive" className="w-full gap-2" onClick={signOut}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </motion.div>
    </div>
  );
}
