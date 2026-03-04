import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Mail, Phone, User, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, getAdminToken } from '../contexts/AuthContext';

interface Message {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const AdminMessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const hostname = window.location.hostname;
      const token = getAdminToken();
      console.log('📩 Loading messages with token:', token?.substring(0, 20) + '***');
      
      const response = await fetch(`http://${hostname}:3001/api/admin/messages`, {
        headers: { 'x-admin-token': token }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load messages');
      }
      const data = await response.json();
      setMessages(data.sort((a: Message, b: Message) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (err) {
      setError('Eroare la încărcarea mesajelor: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error(err);
    } finally {
      setMessageLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const hostname = window.location.hostname;
      const token = getAdminToken();
      const response = await fetch(`http://${hostname}:3001/api/admin/messages/${id}/read`, {
        method: 'PUT',
        headers: { 'x-admin-token': token }
      });
      if (!response.ok) throw new Error('Failed to update message');
      
      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, read: true } : m
      ));

      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, read: true });
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi acest mesaj?')) return;

    try {
      const hostname = window.location.hostname;
      const response = await fetch(`http://${hostname}:3001/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminToken() }
      });
      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading || messageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary-50/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-600">Se încarcă mesajele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50/20 pt-24 pb-16">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-primary-600" />
            </button>
            <div>
              <h1 className="text-4xl font-serif font-bold text-dark-950">Mesaje de contact</h1>
              <p className="text-dark-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} mesaje noi` : 'Toate mesajele citite'}
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-primary-100/60 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-red-600 p-4">
                <h2 className="text-white font-semibold">Tot mesajele ({messages.length})</h2>
              </div>

              {messages.length === 0 ? (
                <div className="p-8 text-center text-dark-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nu sunt mesaje</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (!msg.read) {
                          markAsRead(msg.id);
                        }
                      }}
                      className={`w-full p-4 border-b border-gray-100 text-left hover:bg-primary-50 transition-colors ${
                        selectedMessage?.id === msg.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                      } ${!msg.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-dark-900 truncate ${!msg.read ? 'font-bold' : ''}`}>
                            {msg.fullName}
                          </p>
                          <p className="text-sm text-dark-500 truncate">{msg.email}</p>
                          <p className="text-xs text-dark-400 mt-1 line-clamp-1">{msg.message}</p>
                        </div>
                        {!msg.read && (
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-primary-100/60 p-6 md:p-8 card-lux-hover"
                >
                  {/* Status */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${selectedMessage.read ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span className="text-sm font-medium text-dark-700">
                        {selectedMessage.read ? 'Citit' : 'Necitit'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!selectedMessage.read && (
                        <button
                          onClick={() => markAsRead(selectedMessage.id)}
                          className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(selectedMessage.id)}
                        className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Șterge
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 text-dark-600 mb-1">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Nume</span>
                      </div>
                      <p className="text-dark-900 font-semibold">{selectedMessage.fullName}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-dark-600 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <a 
                        href={`mailto:${selectedMessage.email}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-dark-600 mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">Telefon</span>
                      </div>
                      <a 
                        href={`tel:${selectedMessage.phone.replace(/\s/g, '')}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        {selectedMessage.phone}
                      </a>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-dark-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Data</span>
                      </div>
                      <p className="text-dark-900 font-semibold">
                        {new Date(selectedMessage.timestamp).toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <h3 className="font-semibold text-dark-900 mb-3">Mesajul</h3>
                    <div className="bg-dark-50 rounded-xl p-4 text-dark-700 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-primary-100/60 p-12 flex items-center justify-center min-h-[400px] card-lux-hover"
                >
                  <div className="text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-dark-300" />
                    <p className="text-dark-500 text-lg">Selectează un mesaj pentru a vedea detaliile</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
