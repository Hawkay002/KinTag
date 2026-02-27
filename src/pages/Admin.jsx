import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Send, Trash2, ShieldAlert, Loader2, ChevronLeft, BellRing, CheckCircle2, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

export default function Admin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // 🌟 NEW: Custom Modals
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const ADMIN_EMAIL = "YOUR_EMAIL@gmail.com"; // Keep your exact admin email here!

  const showMessage = (alertTitle, alertMessage, type = 'info', onClose = null) => {
    setCustomAlert({ isOpen: true, title: alertTitle, message: alertMessage, type, onClose });
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Kicks out non-admins using our beautiful new alert instead of window.alert!
    if (currentUser.email !== ADMIN_EMAIL) {
      showMessage("Access Denied", "You are not authorized to view the admin control center.", "error", () => navigate('/'));
      return;
    }

    fetchMessages();
  }, [currentUser, navigate]);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "systemMessages"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(fetched);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) return showMessage("Missing Fields", "Please fill out both the title and body fields.", "warning");
    setSending(true);

    try {
      await addDoc(collection(db, "systemMessages"), {
        title,
        body,
        timestamp: serverTimestamp() 
      });

      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
      });

      showMessage("Broadcast Sent!", "Campaign successfully broadcasted and saved to the database.", "success");
      setTitle('');
      setBody('');
      fetchMessages(); 
    } catch (error) {
      showMessage("Error", "Failed to send the campaign.", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await deleteDoc(doc(db, "systemMessages", messageToDelete));
      setMessages(messages.filter(m => m.id !== messageToDelete));
    } catch (error) {
      showMessage("Error", "Failed to delete the message.", "error");
    } finally {
      setMessageToDelete(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-brandDark" size={40}/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 relative">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 bg-brandDark text-white p-6 rounded-3xl shadow-lg">
          <Link to="/" className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <ShieldAlert className="text-brandGold"/> Admin Control Center
            </h1>
            <p className="text-white/60 text-sm font-medium mt-1">Broadcast system updates to all KinTag users.</p>
          </div>
        </div>

        {/* Create Campaign Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h2 className="text-xl font-bold text-brandDark mb-6 flex items-center gap-2">
            <BellRing size={20} className="text-brandGold"/> Draft New Campaign
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notification Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., 🚀 New Feature Available!"
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-brandDark outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Message Body</label>
              <textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="What do you want to tell your users?"
                rows="3"
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-brandDark outline-none font-medium resize-none"
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={sending}
              className="w-full flex items-center justify-center space-x-2 bg-brandGold text-white p-4 rounded-2xl font-bold hover:bg-amber-500 transition-all shadow-md disabled:opacity-50"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              <span>{sending ? 'Broadcasting to all phones...' : 'Send Campaign Now'}</span>
            </button>
          </form>
        </div>

        {/* Existing Messages List */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100">
          <h2 className="text-xl font-bold text-brandDark mb-6">Campaign History</h2>
          
          {messages.length === 0 ? (
            <p className="text-zinc-500 font-medium text-center py-8">No system messages sent yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-brandDark flex items-center gap-2 mb-1">{msg.title}</h3>
                    <p className="text-sm text-zinc-600 font-medium leading-relaxed mb-3">{msg.body}</p>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* 🌟 OPEN DELETE MODAL */}
                  <button 
                    onClick={() => setMessageToDelete(msg.id)} 
                    className="p-2 text-zinc-400 hover:text-red-500 bg-white border border-zinc-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Message"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌟 GENERIC CUSTOM ALERT MODAL */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
              customAlert.type === 'error' ? 'bg-red-50 text-red-600' :
              customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500' :
              'bg-brandMuted text-brandDark'
            }`}>
              {customAlert.type === 'success' && <CheckCircle2 size={32} />}
              {customAlert.type === 'error' && <AlertOctagon size={32} />}
              {customAlert.type === 'warning' && <AlertTriangle size={32} />}
              {customAlert.type === 'info' && <Info size={32} />}
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">{customAlert.message}</p>
            <button 
              onClick={() => {
                if(customAlert.onClose) customAlert.onClose();
                setCustomAlert({ ...customAlert, isOpen: false });
              }} 
              className="w-full bg-brandDark text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brandAccent transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* 🌟 CUSTOM DELETE CONFIRMATION MODAL */}
      {messageToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brandDark/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-brandDark mb-2 tracking-tight">Delete Message?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">This action cannot be undone. This broadcast will be permanently removed from all users' inboxes.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setMessageToDelete(null)} className="flex-1 bg-brandMuted text-brandDark py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteMessage} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
