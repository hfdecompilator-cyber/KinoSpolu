import { useAuthStore } from '@/stores/authStore';
import { STREAMING_SERVICES } from '@/lib/constants';
import type { StreamingService } from '@/types';

interface ServiceConnectProps {
  compact?: boolean;
}

export function ServiceConnect({ compact = false }: ServiceConnectProps) {
  const { user, connectService, disconnectService } = useAuthStore();

  if (!user) return null;

  const handleToggle = (service: StreamingService) => {
    const isConnected = user.connectedServices.some(
      (s) => s.service === service && s.connected
    );
    if (isConnected) {
      disconnectService(service);
    } else {
      connectService(service);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Connected Services</h3>
          <p className="text-sm text-white/50 mt-1">
            Connect your streaming accounts to join matching watch parties
          </p>
        </div>
      )}
      <div className={compact ? 'grid grid-cols-5 gap-2' : 'grid grid-cols-2 gap-3'}>
        {STREAMING_SERVICES.map((service) => {
          const isConnected = user.connectedServices.some(
            (s) => s.service === service.id && s.connected
          );

          if (compact) {
            return (
              <button
                key={service.id}
                onClick={() => handleToggle(service.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                  isConnected
                    ? 'bg-white/10 ring-2 ring-purple-500/50'
                    : 'bg-white/5 hover:bg-white/10 opacity-50'
                }`}
                title={service.name}
              >
                <span className="text-lg">{service.icon}</span>
                <span className="text-[10px] text-white/60 truncate w-full text-center">{service.name}</span>
              </button>
            );
          }

          return (
            <button
              key={service.id}
              onClick={() => handleToggle(service.id)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border ${
                isConnected
                  ? 'bg-white/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-2xl">{service.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-medium text-white text-sm">{service.name}</div>
                <div className="text-xs text-white/50">{service.description}</div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isConnected
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-white/30'
                }`}
              >
                {isConnected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
