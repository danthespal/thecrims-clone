'use client';

import { useEffect, useRef, useState } from 'react';
import useSession from '@/hooks/useSession';

const COMMANDS = ['/pm', '/r', '/help'];

type ChatMessage = {
  id?: number;
  user_id?: number;
  profile_name?: string;
  recipient_id?: number;
  recipient_profile_name?: string;
  message: string;
  created_at?: string;
  type?: 'system' | 'new_message' | 'private_message';
};

export default function ClubChat() {
  const { session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [lastWhisperFrom, setLastWhisperFrom] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const userId = session?.user?.id;
  const ownProfileName = session?.user?.profile_name;

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket('ws://localhost:4000');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', userId }));
    };

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
      } else if (data.type === 'private_message') {
        const msg = { ...data.message, type: 'private_message' } as ChatMessage;
        if (msg.recipient_id === userId && msg.profile_name) {
          setLastWhisperFrom(msg.profile_name);
        }
        setMessages((prev) => [...prev, msg]);
      } else if (data.type === 'system') {
        setMessages((prev) => [...prev, { message: data.message, type: 'system' }]);
      } else if (data.type === 'online_users') {
        setOnlineUsers(data.users);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const current = newMessage.trim();

    if (current.startsWith('/')) {
      const parts = current.split(' ');
      if (parts[0] === '/pm' && parts[1]?.startsWith('@')) {
        const term = parts[1].slice(1).toLowerCase();
        const matches = messages
          .filter(m => m.profile_name && m.user_id !== userId && onlineUsers.includes(m.user_id!))
          .map(m => m.profile_name!)
          .filter(p => p.toLowerCase().startsWith(term))
          .filter((v, i, a) => a.indexOf(v) === i);
        setSuggestions(matches);
      } else {
        const matches = COMMANDS.filter(cmd => cmd.startsWith(parts[0]));
        setSuggestions(matches);
      }
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [newMessage, messages, onlineUsers, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !connected || cooldown > 0) return;

    const trimmed = newMessage.trim();

    if (trimmed === '/help') {
      setMessages((prev) => [
        ...prev,
        {
          type: 'system',
          message:
            `📘 Available Commands:\n` +
            `• /pm @profile#tag message — send a private message\n` +
            `• /r message — reply to last private message\n` +
            `• /help — show this list`
        }
      ]);
      setNewMessage('');
      return;
    }

    const pmWithTag = trimmed.match(/^\/pm\s+@([\w#]+)\s+(.+)/i);

    if (pmWithTag) {
      const [, fullProfileName, messageBody] = pmWithTag;

      if (fullProfileName === ownProfileName) {
        alert(`❌ You cannot message yourself.`);
        return;
      }

      try {
        const res = await fetch('/api/validation?action=check-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_name: fullProfileName })
        });

        const data = await res.json();
        if (data.available || !data.id) {
          alert(`❌ No user found with name "${fullProfileName}"`);
          return;
        }

        if (!onlineUsers.includes(data.id)) {
          alert(`❌ ${fullProfileName} is not online.`);
          return;
        }

        wsRef.current?.send(JSON.stringify({
          type: 'message',
          userId,
          message: messageBody,
          recipientId: data.id
        }));
      } catch (err) {
        console.error('Error resolving profile:', err);
        alert('❌ Failed to send private message.');
      }

      setNewMessage('');
      setCooldown(10);
      return;
    }

    if (trimmed.startsWith('/r ')) {
      if (!lastWhisperFrom) {
        alert('❌ No recent private message to reply to.');
        return;
      }

      const messageBody = trimmed.slice(3).trim();
      try {
        const res = await fetch('/api/validation?action=check-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_name: lastWhisperFrom })
        });

        const data = await res.json();
        if (data.available || !data.id) {
          alert(`❌ Cannot reply: "${lastWhisperFrom}" not found`);
          return;
        }

        if (!onlineUsers.includes(data.id)) {
          alert(`❌ ${lastWhisperFrom} is not online.`);
          return;
        }

        wsRef.current?.send(JSON.stringify({
          type: 'message',
          userId,
          message: messageBody,
          recipientId: data.id
        }));
      } catch (err) {
        console.error('Error replying with /r:', err);
        alert('❌ Failed to reply.');
      }

      setNewMessage('');
      setCooldown(10);
      return;
    }

    wsRef.current?.send(JSON.stringify({ type: 'message', userId, message: trimmed }));
    setNewMessage('');
    setCooldown(10);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      <h2 className="text-teal-400 text-lg font-bold">
        💬 Club Chat - {onlineUsers.length} user{onlineUsers.length === 1 ? '' : 's'} online
      </h2>

      {!connected ? (
        <div className="h-64 flex items-center justify-center bg-gray-800 text-red-400 rounded">
          WebSocket server is not connected.
        </div>
      ) : (
        <>
          <div className="h-64 overflow-y-auto bg-gray-800 p-3 rounded">
            {messages.map((msg, index) => {
              if (msg.type === 'system') {
                return (
                  <div key={`system-${index}`} className="text-center text-sm text-gray-400 italic whitespace-pre-wrap mb-2">
                    {msg.message}
                  </div>
                );
              }

              const isPrivate = msg.type === 'private_message';
              const isFromMe = msg.user_id === userId;
              const sender = isFromMe ? 'You' : msg.profile_name;
              const recipient = isFromMe ? msg.recipient_profile_name : 'You';
              const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : '';

              return (
                <div
                  key={`msg-${msg.user_id}-${msg.created_at ?? index}`}
                  className={`mb-2 p-2 rounded ${isPrivate ? 'bg-purple-800 border-l-4 border-purple-500' : ''}`}
                >
                  {isPrivate ? (
                    <div className="text-purple-300 text-sm mb-1">
                      💌{' '}
                      {msg.user_id !== userId ? (
                        <span
                          className="cursor-pointer underline"
                          onClick={() => setNewMessage(`/pm @${msg.profile_name} `)}
                        >
                          {sender}
                        </span>
                      ) : (
                        <span className="font-semibold">{sender}</span>
                      )}{' '}
                      →{' '}
                      {msg.recipient_id !== userId ? (
                        <span
                          className="cursor-pointer underline"
                          onClick={() => setNewMessage(`/pm @${msg.recipient_profile_name} `)}
                        >
                          {recipient}
                        </span>
                      ) : (
                        <span className="font-semibold">{recipient}</span>
                      )}
                      <span className="text-gray-400 text-xs ml-2">{time}</span>
                    </div>
                  ) : (
                    <div className="text-teal-300 font-semibold">
                      {msg.user_id !== userId ? (
                        <span
                          className="cursor-pointer"
                          onClick={() => setNewMessage(`/pm @${msg.profile_name} `)}
                        >
                          {msg.profile_name}
                        </span>
                      ) : (
                        <span className="font-semibold">{msg.profile_name}</span>
                      )}
                      <span className="text-gray-400 text-sm ml-2">{time}</span>
                    </div>
                  )}
                  <p className="text-white">{msg.message}</p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="relative">
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
              placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : 'Type a message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
                  e.preventDefault();
                  const first = suggestions[0];
                  setNewMessage(first.startsWith('/') ? first + ' ' : `/pm @${first} `);
                  setShowSuggestions(false);
                } else if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              disabled={cooldown > 0}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 bg-gray-700 text-white mt-1 w-full rounded shadow-md max-h-40 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
                    onClick={() => {
                      setNewMessage(s.startsWith('/') ? s + ' ' : `/pm @${s} `);
                      setShowSuggestions(false);
                    }}
                  >
                    {s.startsWith('/') ? s : `@${s}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
