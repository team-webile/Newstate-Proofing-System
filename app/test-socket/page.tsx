'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket-io';

export default function TestSocketPage() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  
  const { socket, isConnected } = useSocket('test-project');

  useEffect(() => {
    if (socket) {
      setConnected(isConnected());
      
      socket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        addMessage('✅ Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
        addMessage('❌ Disconnected from server');
      });

      socket.on('annotationAdded', (data) => {
        addMessage(`📝 Annotation added: ${JSON.stringify(data)}`);
      });

      socket.on('commentAdded', (data) => {
        addMessage(`💬 Comment added: ${JSON.stringify(data)}`);
      });

      return () => {
        socket.removeAllListeners();
      };
    }
  }, [socket]);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const sendTestMessage = () => {
    if (socket && isConnected()) {
      socket.emit('addAnnotation', {
        projectId: 'test-project',
        fileId: 'test-file',
        annotation: message,
        coordinates: { x: 100, y: 100 },
        addedBy: 'test-user',
        addedByName: 'Test User'
      });
      addMessage(`📤 Sent: ${message}`);
      setMessage('');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Socket.IO Test Page</h1>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold">
            Status: {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter test message"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button
            onClick={sendTestMessage}
            disabled={!connected || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
          >
            Send Test Message
          </button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Socket Messages:</h2>
        <div className="h-96 overflow-y-auto space-y-1">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
