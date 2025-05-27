'use client';

import { useEffect, useRef, useState } from 'react';
import useSession from '@/hooks/useSession';

type ChatMessage = {
  id: number;
  user_id: number;
  profile_name: string;
  message: string;
  created_at: string;
};

export default function ClubChat() {
  const { session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket('ws://localhost:4000');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      console.warn('🔌 WebSocket closed');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setMessages(data.messages);
      } else if (data.type === 'new_message') {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !userId || !connected) return;
    const payload = {
      userId,
      message: newMessage.trim(),
    };
    wsRef.current?.send(JSON.stringify(payload));
    setNewMessage('');
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      <h2 className="text-teal-400 text-lg font-bold">💬 Club Chat</h2>

      {!connected ? (
        <div className="h-64 flex items-center justify-center bg-gray-800 text-red-400 rounded">
          WebSocket server is not connected.
        </div>
      ) : (
        <>
          <div className="h-64 overflow-y-auto bg-gray-800 p-3 rounded">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <span className="text-teal-300 font-semibold">{msg.profile_name}</span>
                <span className="text-gray-400 text-sm ml-2">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
                <p className="text-white">{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!connected}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
