import React from 'react';
import ReactDOM from 'react-dom/client';
import { CreateNetflixRoomExample } from './examples';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          Netflix Room Example
        </h1>
        <p className="text-slate-400 text-center mb-8">
          HEARO-style authentication flow
        </p>
        <CreateNetflixRoomExample />
      </div>
    </div>
  </React.StrictMode>
);
