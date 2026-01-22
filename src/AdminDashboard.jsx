import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Loader2, Plus, Save, Trash2, PenTool, CheckCircle, XCircle, 
  Folder, Search, RefreshCw, ExternalLink, Users, Wrench, Info,
  PieChart, Link as LinkIcon, StickyNote, MessageSquare, ArrowRight, FileText, X
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
                        <td className="p-4">
                           {editingId === client.id ? (
                             <input className="w-full text-xs border p-1 rounded" placeholder="Main ID/Link" value={editForm.folderId} onChange={e => setEditForm({...editForm, folderId: e.target.value})} />
                           ) : (
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                               <Folder size={14} className="text-amber-500"/> <span className="truncate w-20">{client.folderId}</span>
                               <a href={`https://drive.google.com/drive/folders/${client.folderId}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-amber-600"><ExternalLink size={14} /></a>
                             </div>
                           )}
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

    </div>
  );
}
