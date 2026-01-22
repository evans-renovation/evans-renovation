import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Plus, Save, Trash2, PenTool, CheckCircle, XCircle, Folder, Search, RefreshCw } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Client Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      alert("Error loading clients.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newEmail || !newFolderId) return;

    // Helper: If they type a username "smith", auto-add the suffix
    let finalEmail = newEmail.trim();
    if (!finalEmail.includes('@')) {
      finalEmail = finalEmail + "@evans-portal.com";
    }

    try {
      await setDoc(doc(db, "clients", finalEmail), {
        folderId: newFolderId,
        quoteFolderId: "", 
        signatureNeeded: false,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewEmail('');
      setNewFolderId('');
      fetchClients(); // Refresh list
      alert("Client linked successfully!");
    } catch (error) {
      console.error("Error adding client:", error);
      alert("Failed to add client.");
    }
  };

  const toggleSignatureRequest = async (client) => {
    if (!client.quoteFolderId) {
      alert("Please add a Quote Folder ID before requesting a signature.");
      return;
    }
    const newValue = !client.signatureNeeded;
    try {
      await updateDoc(doc(db, "clients", client.id), {
        signatureNeeded: newValue
      });
      // Optimistic update locally
      setClients(clients.map(c => c.id === client.id ? { ...c, signatureNeeded: newValue } : c));
    } catch (error) {
      alert("Error updating status.");
    }
  };

  const startEdit = (client) => {
    setEditingId(client.id);
    setEditForm({ ...client });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "clients", editingId), {
        folderId: editForm.folderId,
        quoteFolderId: editForm.quoteFolderId
      });
      setEditingId(null);
      fetchClients();
    } catch (error) {
      alert("Error saving changes.");
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm("Are you sure you want to unlink this client? (This does not delete files in Drive)")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      fetchClients();
    } catch (error) {
      alert("Error deleting.");
    }
  };

  // Filter clients for search
  const filteredClients = clients.filter(c => c.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden">
      {/* Navbar */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-evans-amber text-slate-900 p-2 rounded font-bold">ADMIN</div>
          <h1 className="font-serif text-xl hidden sm:block">Portal Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchClients} className="p-2 hover:bg-white/10 rounded-full" title="Refresh"><RefreshCw size={20}/></button>
          <button onClick={onLogout} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {isAdding ? <XCircle /> : <Plus />}
              {isAdding ? "Cancel" : "Add New Client"}
            </button>
          </div>

          {/* Add Client Form */}
          {isAdding && (
            <form onSubmit={handleAddClient} className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-amber-100 animate-in slide-in-from-top-4">
              <h3 className="font-bold text-lg mb-4 text-slate-800">Link New Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email / Username</label>
                  <input 
                    type="text" 
                    placeholder="e.g. smith OR smith@gmail.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500"
                    required 
                  />
                  <p className="text-xs text-slate-400 mt-1">For usernames, we auto-add @evans-portal.com</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Main Folder ID</label>
                  <input 
                    type="text" 
                    placeholder="Paste Google Drive Folder ID" 
                    value={newFolderId}
                    onChange={(e) => setNewFolderId(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500"
                    required 
                  />
                </div>
              </div>
              <button className="bg-evans-amber text-slate-900 px-8 py-3 rounded-lg font-bold hover:bg-amber-400 w-full md:w-auto">
                Save Client Link
              </button>
            </form>
          )}

          {/* Clients List */}
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">Client ID</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">Folder IDs</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500">Signature</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Client Name */}
                        <td className="p-4 font-medium text-slate-900">
                          {client.id.replace('@evans-portal.com', '')}
                          {client.id.includes('@evans-portal.com') && <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Username</span>}
                        </td>

                        {/* Folders (Edit Mode vs View Mode) */}
                        <td className="p-4">
                          {editingId === client.id ? (
                            <div className="space-y-2">
                              <input 
                                className="w-full p-2 border rounded text-xs" 
                                placeholder="Main ID"
                                value={editForm.folderId}
                                onChange={e => setEditForm({...editForm, folderId: e.target.value})}
                              />
                              <input 
                                className="w-full p-2 border rounded text-xs" 
                                placeholder="Quote ID (Optional)"
                                value={editForm.quoteFolderId}
                                onChange={e => setEditForm({...editForm, quoteFolderId: e.target.value})}
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Folder size={14} className="text-amber-500"/> 
                                <span className="truncate w-32 md:w-48">{client.folderId}</span>
                              </div>
                              {client.quoteFolderId && (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <PenTool size={12}/> 
                                  <span className="truncate w-32 md:w-48">{client.quoteFolderId}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Signature Status */}
                        <td className="p-4">
                          {client.signature ? (
                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                              <CheckCircle size={14}/> Signed
                            </span>
                          ) : (
                            <button 
                              onClick={() => toggleSignatureRequest(client)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                                client.signatureNeeded 
                                  ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {client.signatureNeeded ? "Requested (Cancel?)" : "Request Sign"}
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          {editingId === client.id ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={saveEdit} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save size={16}/></button>
                              <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><XCircle size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEdit(client)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded"><PenTool size={16}/></button>
                              <button onClick={() => deleteClient(client.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-slate-400">No clients found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
