import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f9fafb',
          backdropFilter: 'blur(16px)',
        },
      }}
    />
  );
}
