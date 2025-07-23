import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <h2 className="text-2xl font-bold mb-2">✅ Test Page Loaded Successfully!</h2>
        <p>This page is loading correctly, which means the routing system is working.</p>
        <p className="mt-2">Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default TestPage; 