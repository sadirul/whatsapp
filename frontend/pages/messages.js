import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { useWhatsAppSocket } from '../hooks/useWhatsAppSocket';
import { whatsappAPI } from '../services/api';
import { formatMessageTime } from '../utils/date';

const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const linkify = (text) => {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    const isUrl = part.startsWith('http://') || part.startsWith('https://') || part.startsWith('www.');
    if (isUrl) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#075E54] underline hover:text-[#054d44] break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const MediaIcon = ({ type, hasMedia, body }) => {
  if (!hasMedia && type === 'chat') return null;
  const iconClass = 'w-5 h-5 text-[#54656f] flex-shrink-0';
  const isPdf = body?.toLowerCase?.().includes('.pdf') || type === 'document';
  if (type === 'image' || type === 'sticker') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === 'video') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === 'audio' || type === 'ptt') {
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  }
  if (type === 'document' || hasMedia) {
    if (isPdf) {
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return null;
};

const MediaPreview = ({ chatId, messageId, type, hasMedia }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef(null);

  const showPreview = hasMedia && (type === 'image' || type === 'sticker' || type === 'document');

  useEffect(() => {
    if (!showPreview || !chatId || !messageId) return;
    setLoading(true);
    setError(false);
    setMediaType(null);
    let cancelled = false;
    whatsappAPI.downloadMessageMedia(chatId, messageId)
      .then((res) => {
        if (cancelled) return;
        const blob = res.data;
        const mime = blob.type || '';
        if (mime.startsWith('image/') || mime === 'application/pdf') {
          const url = window.URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setPreviewUrl(url);
          setMediaType(mime.startsWith('image/') ? 'image' : 'pdf');
        }
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [chatId, messageId, type, hasMedia, showPreview]);

  if (!showPreview || loading) {
    if (showPreview && loading) {
      return (
        <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
        </div>
      );
    }
    return null;
  }

  if (error) return null;

  if (previewUrl && mediaType === 'image') {
    return (
      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={previewUrl}
          alt=""
          className="max-w-full max-h-64 rounded-lg object-contain cursor-pointer hover:opacity-90"
        />
      </a>
    );
  }

  if (previewUrl && mediaType === 'pdf') {
    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-1 w-24 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative group hover:border-gray-300 transition"
      >
        <embed
          src={`${previewUrl}#toolbar=0&navpanes=0`}
          type="application/pdf"
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
          title="PDF preview"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 group-hover:bg-white/60 transition">
          <svg className="w-8 h-8 text-red-600 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium text-gray-600">PDF</span>
        </div>
      </a>
    );
  }

  return null;
};

const formatTime = formatMessageTime;

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingDoc, setSendingDoc] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const userJustSentRef = useRef(false);

  // Real-time Socket.IO: new messages and disconnected
  useWhatsAppSocket({
    onMessage: useCallback((data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
      // Refresh chat list for last message / unread count
      whatsappAPI.getChats().then((res) => {
        if (res.data.success) setChats(res.data.chats || []);
      });
    }, [selectedChat?.id]),
    onDisconnected: useCallback(() => setStatus('disconnected'), []),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    whatsappAPI.getStatus()
      .then((res) => res.data.success && setStatus(res.data.status))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || status !== 'connected') return;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await whatsappAPI.getChats();
        if (res.data.success) setChats(res.data.chats || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, status]);

  useEffect(() => {
    if (!user || !selectedChat || status !== 'connected') return;
    const loadMessages = async () => {
      try {
        const res = await whatsappAPI.getChatMessages(selectedChat.id, 50);
        if (res.data.success) {
          setMessages(res.data.messages || []);
          userJustSentRef.current = true;
          const chatRes = await whatsappAPI.getChats();
          if (chatRes.data.success) setChats(chatRes.data.chats || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load messages');
      }
    };
    loadMessages();
  }, [user, selectedChat?.id, status]);

  // Fallback poll for messages (every 10s) - Socket.IO pushes new messages in real-time
  useEffect(() => {
    if (!selectedChat || status !== 'connected') return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await whatsappAPI.getChatMessages(selectedChat.id, 50);
        if (res.data.success) setMessages(res.data.messages || []);
      } catch (_) {}
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [selectedChat?.id, status]);

  useEffect(() => {
    if (userJustSentRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      userJustSentRef.current = false;
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      const res = await whatsappAPI.sendChatMessage(selectedChat.id, input.trim());
      if (res.data.success && res.data.message) {
        userJustSentRef.current = true;
        setMessages((prev) => [...prev, res.data.message]);
        setInput('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (text) => {
    const toCopy = text || '';
    navigator.clipboard.writeText(toCopy).then(() => {
      setError('');
    }).catch(() => setError('Failed to copy'));
  };

  const handleDownloadMedia = async (messageId) => {
    if (!selectedChat) return;
    try {
      const res = await whatsappAPI.downloadMessageMedia(selectedChat.id, messageId);
      const blob = res.data;
      const disposition = res.headers?.['content-disposition'];
      let filename = `download.${blob.type?.split('/')[1] || 'bin'}`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download');
    }
  };

  const handleDocumentSend = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !selectedChat || sendingDoc) return;
    setSendingDoc(true);
    try {
      const formData = new FormData();
      formData.append('chatId', selectedChat.id);
      formData.append('file', file);
      const res = await whatsappAPI.sendChatDocument(formData);
      if (res.data.success && res.data.message) {
        userJustSentRef.current = true;
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send document');
    } finally {
      setSendingDoc(false);
      e.target.value = '';
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Messages | WPAnyWhere</title>
      </Head>
      <div className="h-full flex overflow-hidden bg-white rounded-xl shadow-xl border border-gray-200 relative">
        {status !== 'connected' ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#e5ddd5] p-8">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect WhatsApp First</h3>
            <p className="text-gray-600 text-center mb-6">
              Link your WhatsApp account from the WhatsApp page to view and send messages.
            </p>
            <button
              onClick={() => router.push('/whatsapp')}
              className="px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-lg transition"
            >
              Go to WhatsApp
            </button>
          </div>
        ) : (
          <>
            {/* Chat list - WhatsApp style */}
            <div className={`w-full md:w-96 flex flex-col border-r border-gray-200 bg-white ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 bg-[#075E54] text-white">
                <h2 className="text-xl font-semibold">Messages</h2>
                <p className="text-sm text-[#a8d5c0]">Your WhatsApp chats</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#075E54]"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-600 text-sm">{error}</div>
                ) : chats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No chats yet</div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                        selectedChat?.id === chat.id ? 'bg-[#e9edef]' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center text-xl font-semibold text-[#54656f] flex-shrink-0 overflow-hidden">
                        {chat.profilePicUrl ? (
                          <img src={chat.profilePicUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          chat.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 truncate">{chat.name}</span>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(chat.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage.fromMe ? 'You: ' : ''}{chat.lastMessage.body}
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-xs flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat panel - slides up from bottom when opened */}
            <div className={`flex-1 flex flex-col bg-[#e5ddd5] min-w-0 transition-all duration-300 ease-out ${selectedChat ? 'animate-slideUp' : ''}`}>
              {selectedChat ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54] text-white">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden p-2 hover:bg-white/10 rounded-full"
                    >
                      ←
                    </button>
                    <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-lg font-semibold text-[#54656f] overflow-hidden">
                      {selectedChat.profilePicUrl ? (
                        <img src={selectedChat.profilePicUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedChat.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{selectedChat.name}</h3>
                      <p className="text-xs text-[#a8d5c0]">
                        {selectedChat.isGroup ? 'Group' : 'Contact'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleScroll}
                      className="h-full overflow-y-auto p-4 space-y-2"
                    >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-lg shadow-sm group ${
                            msg.fromMe
                              ? 'bg-[#DCF8C6] rounded-tr-none'
                              : 'bg-white rounded-tl-none'
                          }`}
                        >
                          {(msg.type === 'image' || msg.type === 'sticker' || (msg.type === 'document' && msg.hasMedia)) && selectedChat && (
                            <MediaPreview
                              chatId={selectedChat.id}
                              messageId={msg.id}
                              type={msg.type}
                              hasMedia={msg.hasMedia}
                            />
                          )}
                          <div className="flex items-start gap-2">
                            {(msg.hasMedia || msg.type !== 'chat') && msg.type !== 'image' && msg.type !== 'sticker' && (
                              <div className="flex-shrink-0 mt-0.5">
                                <MediaIcon type={msg.type} hasMedia={msg.hasMedia} body={msg.body} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {(msg.body || (msg.hasMedia && msg.type !== 'image' && msg.type !== 'sticker')) && (
                                <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                                  {linkify(msg.body || 'Document')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p
                              className={`text-[10px] ${
                                msg.fromMe ? 'text-[#667781]' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleCopyMessage(msg.body)}
                                className="p-1 rounded hover:bg-black/10"
                                title="Copy"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0h2a2 2 0 012 2v2m0 0V6a2 2 0 012 2v2a2 2 0 01-2 2h-2m0 0h-2m0 0h2a2 2 0 002-2v-2m0 0v2a2 2 0 01-2 2h-2m0 0h-2" />
                                </svg>
                              </button>
                              {msg.hasMedia && (
                                <button
                                  onClick={() => handleDownloadMedia(msg.id)}
                                  className="p-1 rounded hover:bg-black/10"
                                  title="Download"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                    {showScrollToBottom && (
                      <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#075E54] hover:bg-[#054d44] text-white text-sm font-medium rounded-full shadow-lg transition z-10"
                      >
                        <span>↓</span> Back to bottom
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSend} className="p-4 bg-[#f0f2f5]">
                    <div className="flex gap-2 items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        onChange={handleDocumentSend}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendingDoc}
                        className="p-3 rounded-full hover:bg-gray-200 text-[#54656f] transition"
                        title="Send document"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                  <div className="text-6xl mb-4 opacity-50">💬</div>
                  <p className="text-lg">Select a chat to start messaging</p>
                  <p className="text-sm mt-2">Your WhatsApp chats appear on the left</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
