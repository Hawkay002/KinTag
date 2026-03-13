import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Send, Trash2, ShieldAlert, Loader2, ArrowLeft, BellRing, CheckCircle2, AlertOctagon, AlertTriangle, Info, Edit2, X } from 'lucide-react'; 

// Lightweight Markdown Parser for Admin Preview
const renderFormattedText = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const isBullet = line.trim().startsWith('-');
    let content = isBullet ? line.substring(line.indexOf('-') + 1).trim() : line;
    
    // Safely escapes HTML and replaces markdown tags
    let htmlContent = content
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-brandDark">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-brandDark/80">$1</em>');
      
    if (isBullet) {
      return <li key={i} className="ml-5 list-disc marker:text-brandGold pl-1 mb-1" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    }
    return <p key={i} className="mb-2 last:mb-0 min-h-[1rem]" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  });
};

export default function Admin() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [editingId, setEditingId] = useState(null);

  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', onClose: null });
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL; 

  const showMessage = (alertTitle, alertMessage, type = 'info', onClose = null) => {
    setCustomAlert({ isOpen: true, title: alertTitle, message: alertMessage, type, onClose });
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.email !== ADMIN_EMAIL) {
      // 🌟 ROUTING FIX: Unauthorized users kicked to dashboard, not home
      showMessage("Access Denied", "You are not authorized to view the admin control center.", "error", () => navigate('/dashboard'));
      return;
    }

    fetchMessages();
  }, [currentUser, navigate, ADMIN_EMAIL]);

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

  const handleEditClick = (msg) => {
    setTitle(msg.title);
    setBody(msg.body);
    setEditingId(msg.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => {
    setTitle('');
    setBody('');
    setEditingId(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!title || !body) {
      return showMessage("Missing Fields", "Please fill out both the Notification Title and Message Body fields.", "warning");
    }
    
    setSending(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "systemMessages", editingId), {
          title,
          body,
        });
        
        showMessage("Update Saved! ✏️", "The campaign has been updated in the inbox (Note: This does not resend push notifications to devices).", "success");
        setEditingId(null);
      } else {
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

        showMessage("Broadcast Sent! 🚀", "Your campaign was successfully saved and broadcasted to all users.", "success");
      }
      
      setTitle('');
      setBody('');
      fetchMessages(); 
    } catch (error) {
      showMessage("Error", "Failed to process the request. Please check your connection and try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await deleteDoc(doc(db, "systemMessages", messageToDelete));
      setMessages(messages.filter(m => m.id !== messageToDelete));
      if (editingId === messageToDelete) {
        cancelEdit();
      }
    } catch (error) {
      showMessage("Error", "Failed to delete the message.", "error");
    } finally {
      setMessageToDelete(null); 
    }
  };

  const inputStyles = "w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-brandDark focus:ring-2 focus:ring-brandDark/10 outline-none transition-all font-medium text-brandDark";
  const labelStyles = "block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1";

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-brandDark w-10 h-10" />
        <span className="font-bold text-zinc-500 tracking-wider uppercase text-sm">Verifying Access...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] p-4 md:p-8 relative pb-24 selection:bg-brandGold selection:text-white">
      
      {/* 🌟 NEW: Premium Background Elements */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brandGold/10 via-emerald-400/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
        
        {/* 🌟 ROUTING FIX: Route back to /dashboard */}
        <Link to="/dashboard" className="group inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md border border-zinc-200 text-zinc-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-white transition-all mb-8 active:scale-95">
          <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brandDark text-brandGold rounded-2xl shadow-lg mb-6 transform -rotate-6">
             <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brandDark tracking-tight mb-2">
            Admin Control Center
          </h1>
          <p className="text-zinc-500 font-medium">Broadcast system updates and alerts to all KinTag users.</p>
        </div>

        {/* Create / Edit Campaign Card */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border p-6 md:p-10 mb-8 transition-colors duration-500 relative overflow-hidden ${editingId ? 'border-brandGold/40 bg-brandGold/5' : 'border-zinc-200/80'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brandGold/5 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-2xl font-extrabold text-brandDark flex items-center gap-3">
              {editingId ? (
                <div className="w-10 h-10 bg-brandGold/20 text-brandGold rounded-xl flex items-center justify-center"><Edit2 size={20} /></div>
              ) : (
                <div className="w-10 h-10 bg-zinc-100 text-brandDark rounded-xl flex items-center justify-center"><BellRing size={20} /></div>
              )}
              {editingId ? 'Edit Existing Campaign' : 'Draft New Campaign'}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-zinc-500 hover:text-brandDark bg-white px-4 py-2 rounded-full border border-zinc-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSend} className="space-y-6 relative z-10">
            <div>
              <label className={labelStyles}>Notification Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., 🚀 New Feature Available!"
                className={inputStyles}
              />
            </div>
            <div>
              <label className={labelStyles}>Message Body</label>
              <textarea 
                value={body} 
                onChange={(e) => setBody(e.target.value)} 
                placeholder="What do you want to tell your users?"
                rows="5"
                className={`${inputStyles} resize-none leading-relaxed`}
              ></textarea>
              
              <div className="flex flex-wrap gap-4 mt-3 ml-2 text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase">
                 <span className="bg-white/50 px-2 py-1 rounded border border-zinc-200"><b className="text-brandDark">**Bold**</b></span>
                 <span className="bg-white/50 px-2 py-1 rounded border border-zinc-200"><i className="text-brandDark">*Italic*</i></span>
                 <span className="bg-white/50 px-2 py-1 rounded border border-zinc-200">- Bullet Point</span>
                 <span className="bg-white/50 px-2 py-1 rounded border border-zinc-200">(Enter) New Line</span>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={sending}
              className={`w-full flex items-center justify-center space-x-2 text-white p-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 ${editingId ? 'bg-brandDark hover:bg-brandAccent hover:-translate-y-0.5' : 'bg-brandGold hover:bg-amber-500 hover:-translate-y-0.5'}`}
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : (editingId ? <CheckCircle2 size={20} /> : <Send size={20} />)}
              <span>{sending ? 'Processing...' : (editingId ? 'Save Changes' : 'Broadcast Campaign')}</span>
            </button>
          </form>
        </div>

        {/* Existing Messages List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-6 md:p-10">
          <h2 className="text-2xl font-extrabold text-brandDark mb-8 tracking-tight">Campaign History</h2>
          
          {messages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-[2rem] bg-zinc-50/50">
              <BellRing size={32} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No system messages sent yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-start gap-6 transition-all duration-300 shadow-sm hover:shadow-md ${editingId === msg.id ? 'bg-brandGold/5 border-brandGold/40' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="w-full overflow-hidden">
                    <h3 className="font-extrabold text-brandDark flex items-center gap-2 mb-3 text-lg">{msg.title}</h3>
                    <div className="text-sm text-zinc-600 font-medium leading-relaxed mb-5 bg-white p-4 rounded-xl border border-zinc-100 shadow-inner">
                      {renderFormattedText(msg.body)}
                    </div>
                    <span className="inline-block bg-white border border-zinc-200 px-3 py-1 rounded-md text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest shadow-sm">
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex sm:flex-col gap-3 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                    <button 
                      onClick={() => handleEditClick(msg)} 
                      className="flex-1 sm:flex-none p-3 text-zinc-500 hover:text-brandDark bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm rounded-xl transition-all flex items-center justify-center active:scale-95"
                      title="Edit Message"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setMessageToDelete(msg.id)} 
                      className="flex-1 sm:flex-none p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 bg-white border border-zinc-200 hover:border-red-200 shadow-sm rounded-xl transition-all flex items-center justify-center active:scale-95"
                      title="Delete Message"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border ${
              customAlert.type === 'success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
              customAlert.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
              customAlert.type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' :
              'bg-zinc-50 text-brandDark border-zinc-200'
            }`}>
              {customAlert.type === 'success' && <CheckCircle2 size={36} />}
              {customAlert.type === 'error' && <AlertOctagon size={36} />}
              {customAlert.type === 'warning' && <AlertTriangle size={36} />}
              {customAlert.type === 'info' && <Info size={36} />}
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">{customAlert.title}</h2>
            <p className="text-zinc-500 mb-8 text-base font-medium leading-relaxed">{customAlert.message}</p>
            <button 
              onClick={() => {
                if(customAlert.onClose) customAlert.onClose();
                setCustomAlert({ ...customAlert, isOpen: false });
              }} 
              className="w-full bg-brandDark text-white py-4 rounded-full font-bold shadow-lg hover:bg-brandAccent active:scale-95 transition-all"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {messageToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertOctagon size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-brandDark mb-3 tracking-tight">Delete Message?</h2>
            <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">This action cannot be undone. This broadcast will be permanently removed from all users' inboxes.</p>
            
            <div className="flex gap-3">
              <button onClick={() => setMessageToDelete(null)} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteMessage} className="flex-1 bg-red-600 text-white py-4 rounded-full font-bold shadow-md hover:bg-red-700 active:scale-95 transition-all">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
