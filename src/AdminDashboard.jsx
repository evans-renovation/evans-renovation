import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Loader2, Plus, Save, Trash2, PenTool, CheckCircle, XCircle, 
  Folder, Search, RefreshCw, ExternalLink, Users, Wrench, Info,
  PieChart, Link as LinkIcon, StickyNote, MessageSquare, ArrowRight, FileText, X, Star,
  ListTodo, TrendingUp, PlusCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('clients'); 
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Analytics
  const [analyticsUrl, setAnalyticsUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Forms
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [copySuccess, setCopySuccess] = useState(null);

  // --- MULTI-DOC REQUEST STATE ---
  const [linkingClient, setLinkingClient] = useState(null);
  const [reqLink, setReqLink] = useState('');
  const [reqName, setReqName] = useState('');

  // --- MULTI-FOLDER STATE ---
  const [linkingFolderClient, setLinkingFolderClient] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderLink, setNewFolderLink] = useState('');

  // --- PROJECT HUB MODAL STATE ---
  const [managingHub, setManagingHub] = useState(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [newDiaryText, setNewDiaryText] = useState('');
  const [newDiaryImg, setNewDiaryImg] = useState('');

  useEffect(() => {
    fetchClients();
    fetchSettings();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, "settings", "dashboard");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setAnalyticsUrl(docSnap.data().analyticsUrl);
    } catch (error) { console.error(error); }
  };

  const saveAnalyticsUrl = async () => {
    try {
      await setDoc(doc(db, "settings", "dashboard"), { analyticsUrl: tempUrl }, { merge: true });
      setAnalyticsUrl(tempUrl);
      setIsEditingUrl(false);
    } catch (error) { alert("Error saving URL"); }
  };

  const extractFolderId = (input) => {
    if (input.includes('drive.google.com')) {
      try {
        const parts = input.split('/folders/');
        if (parts[1]) return parts[1].split('?')[0].split('&')[0];
      } catch (e) { return input; }
    }
    return input;
  };

  // --- AI COPILOT SERVER CONNECTION (PERSISTENT & AUTO-FALLBACK) ---
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false);
  const [modelPreference, setModelPreference] = useState('flash');
  const [activeInvite, setActiveInvite] = useState(null);

  // Real-Time Database Sync Hook
  useEffect(() => {
    const projectId = managingHub?.id || managingHub?.folder?.id;
    if (!projectId) return;

    const chatQuery = query(
      collection(db, `projects/${projectId}/aiChatWorkspace`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      // FIX: Changed 'doc' to 'd' to prevent linter shadowing errors
      const updatedMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatLog(updatedMessages);
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [managingHub]);

  // Live listener for instant incoming pings sent to YOU from other admins
  useEffect(() => {
    if (!user?.email) return;

    const notificationQuery = query(
      collection(db, "adminNotifications"),
      where("toEmail", "==", user.email),
      where("status", "==", "unread"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestInvite = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setActiveInvite(latestInvite);
      } else {
        setActiveInvite(null);
      }
    });

    return () => unsubscribe();
  }, [user?.email]);

  const pingAdmin = async (targetEmail, targetName) => {
    const projectId = managingHub?.id || managingHub?.folder?.id;
    if (!projectId || !user) return;

    try {
      await addDoc(collection(db, "adminNotifications"), {
        toEmail: targetEmail,
        fromName: user.email.split('@')[0].toUpperCase(),
        projectName: managingHub?.folder?.name || "A Client Project",
        projectId: projectId,
        status: "unread",
        timestamp: new Date()
      });

      await addDoc(collection(db, `projects/${projectId}/aiChatWorkspace`), {
        role: 'model',
        text: `📢 System: Instant alert invitation transmitted to ${targetName}.`,
        timestamp: new Date(),
        sender: 'System'
      });

      alert(`Notification sent to ${targetName}!`);
    } catch (err) {
      console.error("Failed to transmit workspace invite:", err);
    }
  };

  // --- CLEAR PROJECT CHAT HISTORY ENGINE ---
  const clearChatHistory = async () => {
    const projectId = managingHub?.id || managingHub?.folder?.id;
    if (!projectId) return;

    const confirmWipe = window.confirm(
      "⚠️ Are you sure you want to permanently clear this project's chat history? This cannot be undone."
    );
    if (!confirmWipe) return;

    try {
      const chatRef = collection(db, `projects/${projectId}/aiChatWorkspace`);
      const snapshot = await getDocs(query(chatRef));
      
      // FIX: Changed 'doc' to 'd' to prevent linter shadowing errors
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      
      alert("Chat history successfully cleared!");
    } catch (err) {
      console.error("Failed to execute chat logs cleanup:", err);
      alert("Failed to clear log database history.");
    }
  };

  // --- DELETE SPECIFIC INDIVIDUAL MESSAGE ---
  const deleteSpecificMessage = async (messageId) => {
    const projectId = managingHub?.id || managingHub?.folder?.id;
    if (!projectId || !messageId) return;

    try {
      await deleteDoc(doc(db, `projects/${projectId}/aiChatWorkspace`, messageId));
    } catch (err) {
      console.error("Failed to delete specific log message:", err);
    }
  };

  const displayLog = chatLog.length > 0 ? chatLog : [
    { 
      role: 'model', 
      text: 'Bonjour! I am your Evans Rénovation Copilot. Ask me anything about this project budget, to-dos, or notes.' 
    }
  ];

  const handleAskCopilot = async () => {
    if (!chatInput.trim() || !managingHub?.folder) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setIsAiTyping(true);

    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);

    const targetFolderId = managingHub?.folder?.folderId;
    const projectId = managingHub?.id || managingHub?.folder?.id || 'default_project';

    try {
      await addDoc(collection(db, `projects/${projectId}/aiChatWorkspace`), {
        role: 'user',
        text: userMsg,
        timestamp: new Date(),
        sender: 'Admin'
      });

      const context = `
        You are an expert AI Construction Project Manager for "Evans Rénovation" in France. 
        You are currently helping the admin team look at the project: "${managingHub.folder.name}".
        Current Phase: ${managingHub.folder.status || 'Planning'}
        Budget: €${managingHub.folder.budgetTotal || 0} (Paid: €${managingHub.folder.budgetPaid || 0})
        Internal Admin Note: ${managingHub.folder.adminNote || 'None'}
        Client To-Dos: ${JSON.stringify(managingHub.folder.todos || [])}
        Site Diary Updates: ${JSON.stringify(managingHub.folder.diary || [])}
      `;

      const response = await fetch('https://askcopilot-wheocns5jq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context, 
          message: userMsg,
          folderId: targetFolderId,
          modelPreference: modelPreference
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      await addDoc(collection(db, `projects/${projectId}/aiChatWorkspace`), {
        role: 'model',
        text: data.reply,
        timestamp: new Date(),
        sender: 'Evans AI'
      });

    } catch (error) {
      console.error("Workspace sync error details:", error);
      setChatLog(prev => [...prev, { role: 'model', text: `System Notice: ${error.message}` }]);
    } finally {
      setIsAiTyping(false);
    }
  };
  
  const handleAddFolder = async () => {
    if (!linkingFolderClient || !newFolderName || !newFolderLink) return;
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      folderId: extractFolderId(newFolderLink)
    };
    try {
      await updateDoc(doc(db, "clients", linkingFolderClient.id), {
        folders: arrayUnion(newFolder)
      });
      setLinkingFolderClient(null);
      setNewFolderName('');
      setNewFolderLink('');
      fetchClients();
    } catch (error) { alert("Error adding folder."); }
  };

  const removeFolder = async (client, folder) => {
    if (!window.confirm(`Remove the folder "${folder.name}"?`)) return;
    try {
      await updateDoc(doc(db, "clients", client.id), {
        folders: arrayRemove(folder)
      });
      fetchClients();
    } catch (error) { alert("Error removing folder."); }
  };
  
  const setDefaultFolder = async (client, folderId) => {
    try {
      await updateDoc(doc(db, "clients", client.id), {
        defaultFolderId: folderId
      });
      fetchClients();
    } catch (error) { alert("Error setting default folder."); }
  };

  const updateFolder = async (client, folderId, updates) => {
    const updatedFolders = client.folders.map(f => 
      f.id === folderId ? { ...f, ...updates } : f
    );
    try {
      await updateDoc(doc(db, "clients", client.id), { folders: updatedFolders });
      fetchClients();
    } catch (error) { alert("Error updating folder"); }
  };
  
  const handleAddRequest = async () => {
    if (!linkingClient || !reqName) return;
    let finalId = reqLink ? extractFolderId(reqLink) : linkingClient.folderId;
    const newRequest = {
      id: Date.now().toString(),
      name: reqName,
      folderId: finalId,
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, "clients", linkingClient.id), {
        signatureRequests: arrayUnion(newRequest)
      });
      setLinkingClient(null);
      setReqLink('');
      setReqName('');
      fetchClients();
    } catch (error) {
      alert("Error adding request.");
    }
  };

  const removeRequest = async (client, request) => {
    if (!window.confirm(`Cancel request for "${request.name}"?`)) return;
    try {
      await updateDoc(doc(db, "clients", client.id), {
        signatureRequests: arrayRemove(request)
      });
      fetchClients();
    } catch (error) { alert("Error removing request."); }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newEmail || !newFolderId) return;
    let finalEmail = newEmail.trim();
    if (!finalEmail.includes('@')) finalEmail = finalEmail + "@evans-portal.com";
    try {
      await setDoc(doc(db, "clients", finalEmail), {
        folderId: extractFolderId(newFolderId),
        signatureRequests: [],
        projectValue: "0", status: "Lead", notes: "", createdAt: new Date().toISOString()
      });
      setIsAdding(false); setNewEmail(''); setNewFolderId(''); fetchClients();
    } catch (error) { alert("Failed to add client."); }
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "clients", editingId), {
        folderId: extractFolderId(editForm.folderId),
        projectValue: editForm.projectValue, status: editForm.status, notes: editForm.notes || ""
      });
      setEditingId(null); fetchClients();
    } catch (error) { alert("Error saving changes."); }
  };

  const deleteClient = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await deleteDoc(doc(db, "clients", id)); fetchClients();
  };

  const downloadReceipt = (client, sig) => {
    const pdfDoc = new jsPDF();
    pdfDoc.setFontSize(20); pdfDoc.text("Certificate of Signature", 105, 20, null, null, "center");
    pdfDoc.setFontSize(12); 
    pdfDoc.text(`Document: ${sig.docName || "Quote"}`, 20, 40);
    pdfDoc.text(`Signer: ${client.id}`, 20, 50); 
    pdfDoc.text(`Date: ${new Date(sig.signedAt).toLocaleString()}`, 20, 60);
    pdfDoc.addImage(sig.image, 'PNG', 20, 80, 80, 40); 
    pdfDoc.save(`Receipt_${sig.docName || "Quote"}.pdf`);
  };

  const copyInvite = (client) => {
    const username = client.id.replace('@evans-portal.com', '');
    const text = `Hi! Here is the link to your personal client portal:\n\n🔗 https://evansrenovation.fr\n👤 Username: ${username}\n🔑 Password: (The one we discussed)\n\nYou can find all your documents and quotes here.`;
    navigator.clipboard.writeText(text); setCopySuccess(client.id); setTimeout(() => setCopySuccess(null), 2000);
  };

  const formatDriveImgLink = (url) => {
    if (!url) return '';
    const match = url.match(/\/d\/(.+?)\//) || url.match(/[?&]id=([^&]+)/);
    return match && match[1] ? `https://drive.google.com/uc?id=${match[1]}` : url;
  };

  const handleAddTodo = () => {
    if (!newTodoText || !managingHub) return;
    const updatedTodos = [...(managingHub.folder.todos || []), { id: Date.now(), text: newTodoText, done: false }];
    updateFolder(managingHub.client, managingHub.folder.id, { todos: updatedTodos });
    setManagingHub({ ...managingHub, folder: { ...managingHub.folder, todos: updatedTodos } });
    setNewTodoText('');
  };

  const handleRemoveTodo = (todoId) => {
    const updatedTodos = managingHub.folder.todos.filter(t => t.id !== todoId);
    updateFolder(managingHub.client, managingHub.folder.id, { todos: updatedTodos });
    setManagingHub({ ...managingHub, folder: { ...managingHub.folder, todos: updatedTodos } });
  };

  const handleAddDiary = () => {
    if (!newDiaryText || !managingHub) return;
    const updatedDiary = [{ id: Date.now(), date: new Date().toISOString(), text: newDiaryText, imgUrl: formatDriveImgLink(newDiaryImg) }, ...(managingHub.folder.diary || [])];
    updateFolder(managingHub.client, managingHub.folder.id, { diary: updatedDiary });
    setManagingHub({ ...managingHub, folder: { ...managingHub.folder, diary: updatedDiary } });
    setNewDiaryText('');
    setNewDiaryImg('');
  };

  const handleRemoveDiary = (entryId) => {
    const updatedDiary = managingHub.folder.diary.filter(d => d.id !== entryId);
    updateFolder(managingHub.client, managingHub.folder.id, { diary: updatedDiary });
    setManagingHub({ ...managingHub, folder: { ...managingHub.folder, diary: updatedDiary } });
  };

  const startEdit = (client) => { setEditingId(client.id); setEditForm({ ...client }); };
  const filteredClients = clients.filter(c => c.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden">
      
      {/* NAVBAR */}
      <div className="bg-slate-900 text-white shadow-md">
        <div className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-evans-amber text-slate-900 p-2 rounded font-bold">ADMIN</div>
            <h1 className="font-serif text-xl hidden sm:block">Portal Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchClients} className="p-2 hover:bg-white/10 rounded-full"><RefreshCw size={20}/></button>
            <button onClick={onLogout} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white">Sign Out</button>
          </div>
        </div>
        <div className="flex px-4 max-w-7xl mx-auto w-full gap-1">
          {['clients', 'analytics', 'tools', 'info'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-bold capitalize flex items-center gap-2 rounded-t-lg transition-colors ${activeTab === tab ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
              {tab === 'clients' && <Users size={16} />}{tab === 'analytics' && <PieChart size={16} />}{tab === 'tools' && <Wrench size={16} />}{tab === 'info' && <Info size={16} />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
        <div className="max-w-7xl mx-auto">
          
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-serif text-slate-900">Profit Tracker</h2>
                 <button onClick={() => { setIsEditingUrl(!isEditingUrl); setTempUrl(analyticsUrl); }} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2">
                   <LinkIcon size={14} /> {analyticsUrl ? "Change Source" : "Connect Sheet"}
                 </button>
              </div>
              {(!analyticsUrl || isEditingUrl) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200 mb-6">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Paste Embed URL..." value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} className="flex-1 p-3 border border-slate-300 rounded-lg" />
                    <button onClick={saveAnalyticsUrl} className="bg-slate-900 text-white px-6 font-bold rounded-lg hover:bg-slate-700">Save</button>
                  </div>
                </div>
              )}
              {analyticsUrl ? (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] relative">
                  <iframe src={analyticsUrl} className="absolute inset-0 w-full h-full border-0" title="Analytics Embed" allowFullScreen></iframe>
                </div>
              ) : !isEditingUrl && <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300"><PieChart size={48} className="text-slate-300 mb-4" /><p className="text-slate-500">No data connected yet.</p></div>}
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800">{isAdding ? <XCircle /> : <Plus />} Add Client</button>
              </div>

              {isAdding && (
                <form onSubmit={handleAddClient} className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-amber-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="Username / Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="p-3 border rounded-lg w-full" required />
                    <input type="text" placeholder="Drive Folder Link or ID" value={newFolderId} onChange={e => setNewFolderId(e.target.value)} className="p-3 border rounded-lg w-full"
