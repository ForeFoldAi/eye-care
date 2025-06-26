import React from 'react';

export default function LoadingEye({ className = '', size = 48 }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ minHeight: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
        <ellipse cx="24" cy="24" rx="22" ry="12" stroke="#2563eb" strokeWidth="3" fill="#e0e7ff" />
        <circle cx="24" cy="24" r="6" fill="#2563eb" />
        <circle cx="24" cy="24" r="3" fill="#fff" />
        <ellipse cx="24" cy="24" rx="22" ry="12" stroke="#2563eb" strokeWidth="3" fill="none" className="opacity-30 animate-pulse" />
      </svg>
    </div>
  );
} 