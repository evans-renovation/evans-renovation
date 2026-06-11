import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  const [reqName, setReqName] = useState(''); // e.g., "Kitchen Quote"

  // --- MULTI-FOLDER STATE ---
  const [linkingFolderClient, setLinkingFolderClient] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderLink, setNewFolderLink] = useState('');

  // --- PROJECT HUB MODAL STATE ---
  const [managingHub, setManagingHub] = useState(null); // Will hold { client, folder }
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

  // --- ACTIONS ---

// --- AI COPILOT SERVER CONNECTION ---
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([
    { role: 'model', text: 'Bonjour! I am your Evans Rénovation Copilot. Ask me anything about this project budget, to-dos, or notes.' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleAskCopilot = async () => {
    if (!chatInput.trim() || !managingHub?.folder) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiTyping(true);

    const context = `
      You are an expert AI Construction Project Manager for "Evans Rénovation" in France. 
      You are currently helping the Admin look at the project: "${managingHub.folder.name}".
      Current Phase: ${managingHub.folder.status || 'Planning'}
      Budget: €${managingHub.folder.budgetTotal || 0} (Paid: €${managingHub.folder.budgetPaid || 0})
      Internal Admin Note: ${managingHub.folder.adminNote || 'None'}
      Client To-Dos: ${JSON.stringify(managingHub.folder.todos || [])}
      Site Diary Updates: ${JSON.stringify(managingHub.folder.diary || [])}
      
      Answer the admin's question concisely, cleanly, and professionally based on this data. Do not make up prices.
    `;

    try {
      const response = await fetch('https://askcopilot-wheocns5jq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context, 
          message: userMsg,
          folderId: managingHub?.folder?.folderId 
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setChatLog(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (error) {
      console.error(error);
      setChatLog(prev => [...prev, { role: 'model', text: `Error connecting to server: ${error.message}` }]);
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

    // Use input ID or fallback to Main Folder
    let finalId = reqLink ? extractFolderId(reqLink) : linkingClient.folderId;

    const newRequest = {
      id: Date.now().toString(), // Unique ID for this request
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
        signatureRequests: [], // New Array Field
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
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("Certificate of Signature", 105, 20, null, null, "center");
    doc.setFontSize(12); 
    doc.text(`Document: ${sig.docName || "Quote"}`, 20, 40);
    doc.text(`Signer: ${client.id}`, 20, 50); 
    doc.text(`Date: ${new Date(sig.signedAt).toLocaleString()}`, 20, 60);
    doc.addImage(sig.image, 'PNG', 20, 80, 80, 40); 
    doc.save(`Receipt_${sig.docName || "Quote"}.pdf`);
  };

  const copyInvite = (client) => {
    const username = client.id.replace('@evans-portal.com', '');
    const text = `Hi! Here is the link to your personal client portal:\n\n🔗 https://evansrenovation.fr\n👤 Username: ${username}\n🔑 Password: (The one we discussed)\n\nYou can find all your documents and quotes here.`;
    navigator.clipboard.writeText(text); setCopySuccess(client.id); setTimeout(() => setCopySuccess(null), 2000);
  };

 // Uses the standard universal content link
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
                             
                             {/* Legacy Main Folder (Kept so old clients don't break) */}
                             {client.folderId && !client.folders?.length && (
                               <div className="flex items-center gap-2 text-sm text-black/60">
                                 <Folder size={14} className="text-evans-heritage"/> <span className="truncate w-20">{client.folderId}</span>
                                 <a href={`https://drive.google.com/drive/folders/${client.folderId}`} target="_blank" rel="noreferrer" className="text-black/40 hover:text-evans-heritage"><ExternalLink size={14} /></a>
                               </div>
                             )}

                            {/* New Specific Job Folders */}
                             {client.folders?.map((f) => (
                               <div key={f.id} className="flex flex-col gap-3 bg-evans-stone text-evans-earth p-3 rounded border border-black/5 w-full text-xs shadow-sm mb-2">
                                 
                                 {/* Top Row: Name and Actions */}
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
                                 
                                 {/* Row 2: Status & Note */}
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

                                 {/* Row 3: Financials & Feature Buttons */}
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

                                 {/* Client Feedback Alerts */}
                                 {(f.clientNote || f.approvedAt || f.declinedAt) && (
                                   <div className="flex flex-col gap-1.5 border-t border-black/5 pt-2">
                                     {f.clientNote && <div className="text-blue-700 font-medium break-words"><span className="text-black/40 font-bold uppercase mr-1">Client Note:</span> {f.clientNote}</div>}
                                     {f.approvedAt && <div className="text-green-700 font-bold flex gap-1 items-center"><CheckCircle size={12}/> Quote Accepted</div>}
                                     {f.declinedAt && <div className="text-red-600 font-bold flex gap-1 items-center"><XCircle size={12}/> Quote Declined</div>}
                                   </div>
                                 )}
                               </div>
                             ))}
                             
                             {/* Add Job Folder Button */}
                             <button onClick={() => { setLinkingFolderClient(client); setNewFolderName(''); setNewFolderLink(''); }} className="text-xs text-evans-heritage font-semibold hover:underline flex items-center gap-1 mt-1">
                               <Plus size={12}/> Add Job Folder
                             </button>
                          </div>
                        </td>
                        
                        {/* MULTI REQUEST COLUMN */}
                        <td className="p-4">
                          <div className="space-y-2">
                             {/* List Active Requests */}
                             {client.signatureRequests?.map((req) => (
                               <div key={req.id} className="flex items-center gap-2 bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-100 w-fit text-xs">
                                 <PenTool size={10} />
                                 <span className="font-bold">{req.name}</span>
                                 <button onClick={() => removeRequest(client, req)} className="text-amber-400 hover:text-red-500"><X size={12}/></button>
                               </div>
                             ))}
                             
                             {/* List Signed Documents (History) */}
                             {client.signatures?.map((sig, idx) => (
                               <div key={idx} className="flex items-center gap-2 bg-green-50 text-green-900 px-2 py-1 rounded border border-green-100 w-fit text-xs">
                                 <CheckCircle size={10} />
                                 <span>{sig.docName || "Quote"}</span>
                                 <button onClick={() => downloadReceipt(client, sig)} className="text-green-600 hover:text-green-900"><Save size={12}/></button>
                               </div>
                             ))}

                             {/* Fallback for old single signature */}
                             {client.signature && !client.signatures && (
                               <div className="flex items-center gap-2 bg-green-50 text-green-900 px-2 py-1 rounded border border-green-100 w-fit text-xs">
                                 <CheckCircle size={10} /> <span>Old Quote</span>
                                 <button onClick={() => downloadReceipt(client, client.signature)} className="text-green-600 hover:text-green-900"><Save size={12}/></button>
                               </div>
                             )}

                             {/* Add Button */}
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

          {/* TOOLS & INFO TABS (Keep same content) */}
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
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Document Name</label>
                <input type="text" autoFocus placeholder="e.g. Kitchen Quote, Variation 01" value={reqName} onChange={(e) => setReqName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Folder Link (Optional)</label>
                <input type="text" placeholder="Paste link or leave empty to use Main Folder" value={reqLink} onChange={(e) => setReqLink(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" />
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setLinkingClient(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button onClick={handleAddRequest} disabled={!reqName} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50">Add to Queue</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- ADD FOLDER MODAL --- */}
      {linkingFolderClient && (
        <div className="fixed inset-0 z-[150] bg-evans-earth/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-serif text-evans-earth mb-4">Add Client-Facing Folder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-black/50 mb-1">Job Name</label>
                <input type="text" autoFocus placeholder="e.g. Pool House Plans & Docs" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full p-3 border border-black/10 rounded outline-none focus:border-evans-heritage" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-black/50 mb-1">Google Drive Folder Link</label>
                <input type="text" placeholder="Paste the link to the client-facing folder here" value={newFolderLink} onChange={(e) => setNewFolderLink(e.target.value)} className="w-full p-3 border border-black/10 rounded outline-none focus:border-evans-heritage" />
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setLinkingFolderClient(null)} className="flex-1 py-3 text-black/50 font-bold hover:bg-slate-50 rounded">Cancel</button>
                <button onClick={handleAddFolder} disabled={!newFolderName || !newFolderLink} className="flex-[2] py-3 bg-evans-earth text-white font-bold rounded hover:bg-black/80 disabled:opacity-50">Add Folder</button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* --- MANAGE PROJECT HUB MODAL --- */}
      {managingHub && (
        <div className="fixed inset-0 z-[200] bg-evans-earth/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-evans-stone w-full max-w-5xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-white p-6 border-b border-black/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-serif text-evans-earth mb-1">Project Hub: {managingHub.folder.name}</h3>
                <p className="text-xs font-bold uppercase text-black/40">Manage To-Dos and Site Diary</p>
              </div>
              <button onClick={() => setManagingHub(null)} className="bg-black/5 hover:bg-black/10 text-evans-earth rounded-full p-2 transition-colors"><X size={20} /></button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto">
               
               {/* LEFT COL: Action Required (To-Dos) */}
               <div className="flex-1 bg-white p-5 rounded border border-black/5">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2"><ListTodo size={16}/> Client To-Do List</h4>
                 
                 {/* Add To-Do */}
                 <div className="flex gap-2 mb-6">
                   <input type="text" placeholder="e.g. Choose tile grout color" value={newTodoText} onChange={e => setNewTodoText(e.target.value)} className="flex-1 text-sm p-2.5 border border-black/10 rounded focus:border-evans-heritage outline-none" />
                   <button onClick={handleAddTodo} disabled={!newTodoText} className="bg-evans-heritage text-white px-4 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-[#586751]">Add</button>
                 </div>

                 {/* List To-Dos */}
                 <div className="flex flex-col gap-2">
                   {managingHub.folder.todos?.map(todo => (
                     <div key={todo.id} className="flex justify-between items-start gap-3 p-3 rounded border border-black/5 bg-slate-50 text-sm">
                       <span className={todo.done ? 'line-through text-black/40' : 'text-evans-earth font-medium'}>{todo.text}</span>
                       <button onClick={() => handleRemoveTodo(todo.id)} className="text-red-500 hover:text-red-700 shrink-0"><Trash2 size={14}/></button>
                     </div>
                   ))}
                   {(!managingHub.folder.todos || managingHub.folder.todos.length === 0) && <p className="text-xs text-black/40 italic">No tasks assigned.</p>}
                 </div>
               </div>

               {/* RIGHT COL: Site Diary */}
               <div className="flex-1 bg-white p-5 rounded border border-black/5">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2"><FileText size={16}/> Site Diary Updates</h4>
                 
                 {/* Add Diary */}
                 <div className="flex flex-col gap-2 mb-6 bg-slate-50 p-3 rounded border border-black/5">
                   <textarea placeholder="Write a progress update..." value={newDiaryText} onChange={e => setNewDiaryText(e.target.value)} className="w-full text-sm p-2.5 border border-black/10 rounded focus:border-evans-heritage outline-none resize-none h-20" />
                   <input type="text" placeholder="Google Drive Image Link (Optional)" value={newDiaryImg} onChange={e => setNewDiaryImg(e.target.value)} className="w-full text-xs p-2 border border-black/10 rounded outline-none" />
                   <button onClick={handleAddDiary} disabled={!newDiaryText} className="w-full mt-1 bg-evans-earth text-white py-2 rounded text-xs font-bold uppercase disabled:opacity-50 hover:bg-black/80">Post Update</button>
                 </div>

                 {/* List Diary */}
                 <div className="flex flex-col gap-4">
                   {managingHub.folder.diary?.map(entry => (
                     <div key={entry.id} className="p-4 rounded border border-black/5 bg-white shadow-sm relative">
                       <button onClick={() => handleRemoveDiary(entry.id)} className="absolute top-2 right-2 text-black/20 hover:text-red-500"><X size={14}/></button>
                       <div className="text-[10px] font-bold uppercase text-evans-heritage mb-2">{new Date(entry.date).toLocaleDateString()}</div>
                       {entry.imgUrl && (
                         <div className="mb-3 rounded overflow-hidden border border-black/10">
                           <img src={entry.imgUrl} alt="Progress" className="w-full h-auto object-cover max-h-32" />
                         </div>
                       )}
                       <p className="text-sm text-evans-earth">{entry.text}</p>
                     </div>
                   ))}
                   {(!managingHub.folder.diary || managingHub.folder.diary.length === 0) && <p className="text-xs text-black/40 italic">No diary entries yet.</p>}
                 </div>{/* --- AI COPILOT CHAT UI --- */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
              <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Evans Rénovation AI Copilot
                </h3>
              </div>
              
              <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-lg rounded-bl-none text-sm shadow-sm flex items-center gap-2">
                      <span className="animate-pulse">●</span><span className="animate-pulse delay-75">●</span><span className="animate-pulse delay-150">●</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
                  disabled={isAiTyping}
                  placeholder="Ask about this project's budget, to-dos, or notes..." 
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
                <button 
                  onClick={handleAskCopilot}
                  disabled={!chatInput.trim() || isAiTyping}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
            {/* --- END AI COPILOT --- */}
                 
               </div>
               
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
