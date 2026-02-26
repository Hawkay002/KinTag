import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Send, Trash2, ShieldAlert, Loader2, ChevronLeft, BellRing } from 'lucide-react';

export default function Admin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 🌟 SECURITY LOCK: Change this to your exact email address!
  const ADMIN_EMAIL = "shovith2@gmail.com"; 

  useEffect(() => {
    // Kick out anyone who isn't logged in, or isn't the Admin
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.email !== ADMIN_EMAIL) {
      alert("Unauthorized: You do not have admin access.");
      navigate('/');
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
    if (!title || !body) return alert("Please fill out both fields.");
    setSending(true);

    try {
      // 1. Save permanently to the Firestore Database
      await addDoc(collection(db, "systemMessages"), {
        title,
        body,
        timestamp: serverTimestamp() // Uses Google's exact server time!
      });

      // 2. Trigger the Vercel Broadcast to buzz everyone's phones
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body })
      });

      alert("Campaign successfully broadcasted and saved!");
      setTitle('');
      setBody('');
      fetchMessages(); 
    } catch (error) {
      console.error(error);
      alert("Error sending campaign.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this system message permanently? It will be removed from everyone's app.")) return;
    try {
      await deleteDoc(doc(db, "systemMessages", id));
      setMessages(messages.filter(m => m.id !== id));
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-brandDark" size={40}/></div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
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
                      {/* Safely handle Timestamps */}
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(msg.id)} 
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
    </div>
  );
}
