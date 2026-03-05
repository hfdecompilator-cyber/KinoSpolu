import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetflixStore } from '@/store/netflix-store';
import { Loader2, Eye, EyeOff, Shield, Wifi, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginDemo, isLoading, error, clearError } = useNetflixStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/profiles');
  };

  const handleDemo = async () => {
    const success = await loginDemo();
    if (success) navigate('/profiles');
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      {/* Netflix-style header */}
      <header className="px-6 py-5">
        <svg viewBox="0 0 111 30" className="h-7 fill-[#E50914]">
          <path d="M105.06 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 7.969c-1.687-.282-3.344-.376-5.031-.595l6.03-13.622L94.174 0h5.25l3.03 7.906L105.593 0h5.25l-5.78 14.28zM90.91 0l-.003 23.654c-1.534.094-3.064.156-4.593.25L86.31 0h4.6zM81.22 3.844h-6.093V0H92v3.844h-6.094v20.093c-1.562.063-3.093.157-4.687.22V3.843zM68.75 13.735c2.093-.156 4.218-.375 6.344-.438V0h-4.687v9.78l-5.937-9.78h-5v23.406c1.5-.094 3-.22 4.5-.282V9.373l4.78 4.362zM53.69 0v23.313c3.094-.094 6.218-.313 9.343-.376V19.22h-4.687V13.22h4.687V9.375H58.34V3.75h4.687V0H53.69zM38.59 0l3.937 15.844L46.5 0h5.094L44.87 24.156c-1.532.063-3.032.094-4.563.22L33.53 0h5.06zM24.906 0v3.75h-4.687v15.47h4.687v3.718c-3.125.094-6.25.313-9.375.5V0h9.375zM10.625 0v20.72c-1.563.063-3.094.22-4.625.345V0h4.625zM5.28 0L0 20.844v3.375c3.156-.407 6.312-.72 9.468-.938V20.75H5.78L10.31 0H5.28z" />
        </svg>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-black/75 rounded-lg p-12 md:p-16">
            <h1 className="text-white text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-gray-400 text-sm mb-7">
              Connect your Netflix account (HEARO-style auth)
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#E87C03]/20 border border-[#E87C03]/50 text-[#E87C03] rounded-md p-4 mb-6 text-sm"
              >
                {error}
                <button onClick={clearError} className="ml-2 underline text-xs opacity-75">dismiss</button>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full bg-[#333] text-white rounded-md px-4 py-4 text-base outline-none border border-transparent focus:border-white/30 transition placeholder:text-gray-500"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-[#333] text-white rounded-md px-4 py-4 pr-12 text-base outline-none border border-transparent focus:border-white/30 transition placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-[#E50914] hover:bg-[#F6121D] text-white font-semibold py-3.5 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black/75 px-4 text-gray-500 text-sm">or</span>
              </div>
            </div>

            <button
              onClick={handleDemo}
              disabled={isLoading}
              className="w-full bg-[#333] hover:bg-[#444] text-white font-medium py-3.5 rounded-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Try Demo Mode
            </button>

            <p className="text-gray-500 text-xs mt-4 text-center">
              Demo mode uses simulated Netflix data so you can test the full room flow without credentials.
            </p>
          </div>

          {/* HEARO-style auth explanation */}
          <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield size={18} className="text-[#E50914]" />
              How Authentication Works (HEARO-style)
            </h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <Smartphone size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-gray-300">Like HEARO on Android:</strong> HEARO uses a WebView
                  to load Netflix's login page, then captures your session cookies after you sign in.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Wifi size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-gray-300">Our approach:</strong> Your credentials are sent to
                  our backend, which authenticates directly with Netflix's API — the same mechanism,
                  but server-side instead of a WebView. Session cookies are stored on the server.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-gray-500 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-gray-300">Security:</strong> Credentials are never stored.
                  Only the session is maintained for browsing and room creation.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
