import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Loader2, Plus, Save, Trash2, PenTool, CheckCircle, XCircle, 
  Folder, Search, RefreshCw, ExternalLink, Users, Wrench, Info,
  PieChart, Link as LinkIcon, StickyNote, MessageSquare, X, Star,
  ListTodo, TrendingUp
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

  // --- AI COPILOT SERVER CONNECTION ---
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isWorkspaceMaximized, setIsWorkspaceMaximized] = useState(false);
  const [modelPreference, setModelPreference] = useState('flash');
  const [activeInvite, setActiveInvite] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchSettings();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClients(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
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

  // Real-Time Database Sync Hook
  useEffect(() => {
    const projectId = managingHub?.id || managingHub?.folder?.id;
    if (!projectId) return;

    const chatQuery = query(
      collection(db, `projects/${projectId}/aiChatWorkspace`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const updatedMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatLog(updatedMessages);
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [managingHub]);

  // Live listener for instant incoming pings
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
      
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      
      alert("Chat history successfully cleared!");
    } catch (err) {
      console.error("Failed to execute chat logs cleanup:", err);
      alert("Failed to clear log database history.");
    }
  };

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
              {tab === 'clients' && <Users size={16} />}
              {tab === 'analytics' && <PieChart size={16} />}
              {tab === 'tools' && <Wrench size={16} />}
              {tab === 'info' && <Info size={16} />}
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
              ) : (!isEditingUrl && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                  <PieChart size={48} className="text-slate-300 mb-4" />
                  <p className="text-slate-500">No data connected yet.</p>
                </div>
              ))}
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
                    <input type="text" placeholder="Drive Folder Link or ID" value={newFolderId} onChange={e => setNewFolderId(e.target.value)} className="p-3 border rounded-lg w-full" required />
                  </div>
                  <button className="bg-evans-amber px-6 py-2 rounded font-bold">Save</button>
                </form>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Client</th>
                      <th className="p-4">Private Notes</th>
                      <th className="p-4">Folders</th>
                      <th className="p-4">Pending Requests</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{client.id.replace('@evans-portal.com', '')}</div>
                          <button onClick={() => copyInvite(client)} className="text-xs mt-1 flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
                             {copySuccess === client.id ? <CheckCircle size={12}/> : <MessageSquare size={12} />} {copySuccess === client.id ? "Copied!" : "Copy Invite"}
                          </button>
                        </td>
                        <td className="p-4">
                          {editingId === client.id ? (
                            <textarea className="w-full p-2 border rounded text-xs h-20" placeholder="Notes..." value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                          ) : (
                            client.notes ? <div className="flex items-start gap-2 max-w-[200px]"><StickyNote size={14} className="text-amber-500 shrink-0 mt-0.5" /><span className="text-xs text-slate-600 truncate">{client.notes}</span></div> : <span className="text-xs text-slate-300 italic">No notes</span>
                          )}
                        </td>
                        {/* MULTI-FOLDER COLUMN */}
                        <td className="p-4 align-top">
                          <div className="space-y-2">
                             
                             {/* Legacy Main Folder */}
                             {client.folderId && !client.folders?.length && (
                               <div className="flex items-center gap-2 text-sm text-black/60">
                                 <Folder size={14} className="text-evans-heritage"/> <span className="truncate w-20">{client.folderId}</span>
                                 <a href={`https://drive.google.com/drive/folders/${client.folderId}`} target="_blank" rel="noreferrer" className="text-black/40 hover:text-evans-heritage"><ExternalLink size={14} /></a>
                               </div>
                             )}

                            {/* New Specific Job Folders */}
                             {client.folders?.map((f) => (
                               <div key={f.id} className="flex flex-col gap-3 bg-evans-stone text-evans-earth p-3 rounded border border-black/5 w-full text-xs shadow-sm mb-2">
                                 <div className="flex items-center justify-between border-b border-black/5 pb-2">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                     <Folder size={14} className="text-evans-heritage shrink-0" />
                                     <span className="font-bold text-sm truncate">
                                       {f.name} {client.defaultFolderId === f.folderId && <span className="text-amber-500 ml-1 text-xs">(Default)</span>}
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-3 shrink-0">
                                      <button onClick={() => setDefaultFolder(client, f.folderId)} className={`hover:text-amber-500 transition-colors ${client.defaultFolderId === f.folderId ? 'text-amber-500' : 'text-black/20'}`} title="Set as default folder"><Star size={16} className={client.defaultFolderId === f.folderId ? "fill-current" : ""} /></button>
                                      <a href={`https://drive.google.com/drive/folders/${f.folderId}`} target="_blank" rel="noreferrer" className="text-black/40 hover:text-blue-500"><ExternalLink size={16} /></a>
                                      <button onClick={() => removeFolder(client, f)} className="text-black/40 hover:text-red-500"><X size={16}/></button>
                                   </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-2">
                                   <select value={f.status || 'Planning'} onChange={(e) => updateFolder(client, f.id, { status: e.target.value })} className="border border-black/10 rounded p-1.5 bg-white outline-none focus:border-evans-heritage font-semibold">
                                     <option>Planning</option>
                                     <option>Quoting</option>
                                     <option>Pending Approval</option>
                                     <option>Accepted</option>
                                     <option>In Progress</option>
                                     <option>Billed</option>
                                     <option>Completed</option>
                                   </select>
                                   <input type="text" placeholder="Note to client..." defaultValue={f.adminNote || ''} onBlur={(e) => { if (e.target.value !== (f.adminNote || '')) updateFolder(client, f.id, { adminNote: e.target.value }); }} className="flex-1 p-1.5 border border-black/10 rounded outline-none focus:border-evans-heritage" />
                                 </div>

                                 <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded border border-black/5">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp size={14} className="text-black/40" />
                                      <span className="font-semibold text-black/50 uppercase tracking-wider text-[10px]">Budget: €</span>
                                      <input type="number" placeholder="Total" defaultValue={f.budgetTotal || ''} onBlur={(e) => updateFolder(client, f.id, { budgetTotal: e.target.value })} className="w-20 p-1 border-b border-black/10 outline-none focus:border-evans-heritage text-center" />
                                      <span className="text-black/40">/ Paid: €</span>
                                      <input type="number" placeholder="Paid" defaultValue={f.budgetPaid || ''} onBlur={(e) => updateFolder(client, f.id, { budgetPaid: e.target.value })} className="w-20 p-1 border-b border-black/10 outline-none focus:border-evans-heritage text-center" />
                                    </div>

                                    <div className="flex gap-3 ml-auto">
                                      <button onClick={() => setManagingHub({ client, folder: f })} className="flex items-center gap-1 bg-evans-earth text-white px-3 py-1.5 rounded hover:bg-black/80 font-bold text-[11px] uppercase transition-all shadow-sm">
                                        Manage Project Hub
                                      </button>
                                    </div>
                                 </div>

                                 {(f.clientNote || f.approvedAt || f.declinedAt) && (
                                   <div className="flex flex-col gap-1.5 border-t border-black/5 pt-2">
                                     {f.clientNote && <div className="text-blue-700 font-medium break-words"><span className="text-black/40 font-bold uppercase mr-1">Client Note:</span> {f.clientNote}</div>}
                                     {f.approvedAt && <div className="text-green-700 font-bold flex gap-1 items-center"><CheckCircle size={12}/> Quote Accepted</div>}
                                     {f.declinedAt && <div className="text-red-600 font-bold flex gap-1 items-center"><XCircle size={12}/> Quote Declined</div>}
                                   </div>
                                 )}
                               </div>
                             ))}
                             
                             <button onClick={() => { setLinkingFolderClient(client); setNewFolderName(''); setNewFolderLink(''); }} className="text-xs text-evans-heritage font-semibold hover:underline flex items-center gap-1 mt-1">
                               <Plus size={12}/> Add Job Folder
                             </button>
                          </div>
                        </td>
                        
                        {/* MULTI REQUEST COLUMN */}
                        <td className="p-4">
                          <div className="space-y-2">
                             {client.signatureRequests?.map((req) => (
                               <div key={req.id} className="flex items-center gap-2 bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-100 w-fit text-xs">
                                 <PenTool size={10} />
                                 <span className="font-bold">{req.name}</span>
                                 <button onClick={() => removeRequest(client, req)} className="text-amber-400 hover:text-red-500"><X size={12}/></button>
                               </div>
                             ))}
                             
                             {client.signatures?.map((sig, idx) => (
                               <div key={idx} className="flex items-center gap-2 bg-green-50 text-green-900 px-2 py-1 rounded border border-green-100 w-fit text-xs">
                                 <CheckCircle size={10} />
                                 <span>{sig.docName || "Quote"}</span>
                                 <button onClick={() => downloadReceipt(client, sig)} className="text-green-600 hover:text-green-900"><Save size={12}/></button>
                               </div>
                             ))}

                             {client.signature && !client.signatures && (
                               <div className="flex items-center gap-2 bg-green-50 text-green-900 px-2 py-1 rounded border border-green-100 w-fit text-xs">
                                 <CheckCircle size={10} /> <span>Old Quote</span>
                                 <button onClick={() => downloadReceipt(client, client.signature)} className="text-green-600 hover:text-green-900"><Save size={12}/></button>
                               </div>
                             )}

                             <button onClick={() => { setLinkingClient(client); setReqName(''); setReqLink(''); }} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                               <Plus size={12}/> Add Request
                             </button>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          {editingId === client.id ? (
                            <div className="flex justify-end gap-2"><button onClick={saveEdit} className="p-2 bg-green-100 text-green-700 rounded"><Save size={16}/></button><button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded"><XCircle size={16}/></button></div>
                          ) : (
                            <div className="flex justify-end gap-2"><button onClick={() => startEdit(client)} className="p-2 text-slate-400 hover:text-slate-900 rounded"><Wrench size={16}/></button><button onClick={() => deleteClient(client.id)} className="p-2 text-slate-400 hover:text-red-600 rounded"><Trash2 size={16}/></button></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}

          {/* TOOLS & INFO TABS */}
          {activeTab === 'tools' && <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">...Tools content...</div>}
          {activeTab === 'info' && <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">...Info content...</div>}
        </div>
      </div>

     {/* --- ADD REQUEST MODAL --- */}
      {linkingClient && (
        <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-serif text-slate-900 mb-4">Request Signature</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Document Name (e.g., Quote #123)" 
                value={reqName} 
                onChange={(e) => setReqName(e.target.value)} 
                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500" 
              />
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setLinkingClient(null); setReqName(''); }} 
                  className="flex-1 p-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddRequest} 
                  className="flex-1 p-3 text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-bold transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGE HUB MODAL (Required so the manage buttons work) --- */}
      {managingHub && (
        <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <button onClick={() => setManagingHub(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X />
            </button>
            <h3 className="text-xl font-serif mb-4">Hub Settings: {managingHub.folder?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Add To-Do</label>
                <div className="flex gap-2">
                  <input type="text" value={newTodoText} onChange={e => setNewTodoText(e.target.value)} className="flex-1 p-2 border rounded" placeholder="New task..." />
                  <button onClick={handleAddTodo} className="bg-slate-900 text-white px-4 rounded font-bold">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
