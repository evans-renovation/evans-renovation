import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, Lock, Loader2, User, PenTool, CheckCircle, Save, Eraser, Folder, ArrowLeft, FileText, ChevronRight, MessageSquare, XCircle, CheckSquare, Square, ListTodo, Wallet, Eye, EyeOff } from 'lucide-react';
import { auth, db, loginWithGoogle, loginWithEmail, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';
import AdminDashboard from './AdminDashboard'; 

const PORTAL_DOMAIN = "@evans-portal.com"; 
const ADMIN_EMAILS = ["cameron@evansrenovation.fr", "admin@evansrenovation.fr", "bradley@evansrenovation.fr"];

// --- DICTIONARY ---
const TRANSLATIONS = {
  en: {
    loginTitle: "Client Login",
    username: "Username",
    password: "Password",
    loginBtn: "Log In",
    googleBtn: "Or sign in with Google",
    signOut: "Sign Out",
    projectFiles: "Project Files",
    backToAll: "Back to All Files",
    review: "Review",
    sign: "Sign",
    accessDenied: "Access Denied",
    noFolder: "No folder linked to this account.",
    drawHere: "Draw here",
    clear: "Clear",
    confirm: "Confirm Signature",
    signingText: "By signing, I accept the terms of the document",
    signSuccess: "signed successfully!",
    drawError: "Please draw your signature.",
    reviewing: "Reviewing",
    docsPending: "Documents to Sign"
  },
  fr: {
    loginTitle: "Espace Client",
    username: "Identifiant",
    password: "Mot de passe",
    loginBtn: "Se connecter",
    googleBtn: "S'identifier avec Google",
    signOut: "Déconnexion",
    projectFiles: "Dossiers Projet",
    backToAll: "Retour aux fichiers",
    review: "Voir",
    sign: "Signer",
    accessDenied: "Accès Refusé",
    noFolder: "Aucun dossier lié à ce compte.",
    drawHere: "Signez ici",
    clear: "Effacer",
    confirm: "Valider la signature",
    signingText: "En signant, j'accepte les termes du document",
    signSuccess: "signé avec succès !",
    drawError: "Veuillez signer avant de valider.",
    reviewing: "Document",
    docsPending: "Documents à Signer"
  }
};

// --- UPDATED FUNCTION SIGNATURE: Now accepts 'initialLang' ---
export default function ClientPortal({ isOpen, onClose, initialLang = 'en' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- SYNC LANGUAGE ---
  // If the homepage changes language, we update here too
  const [lang, setLang] = useState(initialLang);
  
  useEffect(() => {
    if (initialLang) {
      setLang(initialLang);
    }
  }, [initialLang]);

  const t = TRANSLATIONS[lang]; 

  // Data State
  const [clientData, setClientData] = useState(null);
  const [requests, setRequests] = useState([]); 
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);

  // Sign Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const sigPad = useRef({});
  const [isSavingSig, setIsSavingSig] = useState(false);
  const [clientNoteInput, setClientNoteInput] = useState('');

  // Login
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !ADMIN_EMAILS.includes(currentUser.email)) {
        await fetchClientData(currentUser.email);
      } else {
        setRequests([]);
        setClientData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchClientData = async (email) => {
    try {
      const docRef = doc(db, "clients", email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClientData(data);
        
        // 1. Try to load their manually set Default Folder first
        if (data.defaultFolderId) {
          setActiveFolderId(data.defaultFolderId);
        } 
        // 2. If no default is set, load the first job folder in the list
        else if (data.folders && data.folders.length > 0) {
          setActiveFolderId(data.folders[0].folderId);
        } 
        // 3. Fallback to legacy folder
        else {
          setActiveFolderId(data.folderId);
        }

        if (data.signatureRequests && data.signatureRequests.length > 0) {
          setRequests(data.signatureRequests);
        } else {
          setRequests([]);
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setIsSubmitting(true);
    let finalEmail = usernameInput.trim();
    if (!finalEmail.includes('@')) finalEmail = finalEmail + PORTAL_DOMAIN;
    try { await loginWithEmail(finalEmail, password); } 
    catch (err) { setError("Incorrect username or password."); } 
    finally { setIsSubmitting(false); }
  };

  const openRequest = (req) => { setCurrentRequest(req); setActiveFolderId(req.folderId); };
  
  const backToMain = () => { 
    setCurrentRequest(null); 
    if (clientData.defaultFolderId) {
      setActiveFolderId(clientData.defaultFolderId);
    } else if (clientData.folders && clientData.folders.length > 0) {
      setActiveFolderId(clientData.folders[0].folderId);
    } else {
      setActiveFolderId(clientData.folderId); 
    }
  };

  const updateActiveFolder = async (updates) => {
    if (!clientData || !activeFolderId) return;
    const updatedFolders = clientData.folders.map(f => 
      f.folderId === activeFolderId ? { ...f, ...updates } : f
    );
    try {
      await updateDoc(doc(db, "clients", user.email), { folders: updatedFolders });
      setClientData({ ...clientData, folders: updatedFolders }); // Refresh UI instantly
    } catch (error) { alert("Error saving."); }
  };
  
  const toggleTodo = (todoId) => {
    const activeFolderObj = clientData?.folders?.find(f => f.folderId === activeFolderId);
    if (!activeFolderObj || !activeFolderObj.todos) return;
    const updatedTodos = activeFolderObj.todos.map(t => t.id === todoId ? { ...t, done: !t.done } : t);
    updateActiveFolder({ todos: updatedTodos });
  };

  const saveSignature = async () => {
    if (sigPad.current.isEmpty()) { alert(t.drawError); return; }
    setIsSavingSig(true);
    try {
      const signatureImage = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      const timestamp = new Date().toISOString();
      const newSignature = {
        signedAt: timestamp, image: signatureImage, signer: user.email,
        docName: currentRequest.name, docId: currentRequest.id
      };

      const clientRef = doc(db, "clients", user.email);
      await updateDoc(clientRef, { signatures: arrayUnion(newSignature), signatureRequests: arrayRemove(currentRequest) });

      setRequests(requests.filter(r => r.id !== currentRequest.id));
      setShowSignModal(false);
      backToMain();
      alert(`"${currentRequest.name}" ${t.signSuccess}`);
    } catch (error) { console.error(error); alert("Error saving."); } 
    finally { setIsSavingSig(false); }
  };

  if (isOpen && user && ADMIN_EMAILS.includes(user.email)) {
    return <AdminDashboard user={user} onLogout={logout} />;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]"><X size={32} /></button>

      <div className="bg-white w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl h-[85vh] flex flex-col relative">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <Lock className="text-evans-amber" size={24} />
            <h2 className="font-serif text-xl">{t.loginTitle}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle (Syncs with homepage but can be overridden) */}
            
            {user && <button onClick={logout} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2">{t.signOut} <LogOut size={14} /></button>}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 bg-slate-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>
          ) : !user ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-sm">
                 <div className="text-center mb-8"><div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600"><User size={32} /></div><h3 className="text-2xl font-serif text-slate-900">{t.loginTitle}</h3></div>
                {/* --- BROWSER-OPTIMIZED LOGIN FORM --- */}
                  <form onSubmit={handleLogin} className="space-y-5 mb-8">
                    
                    {/* Username Box */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-black/50 mb-1.5">{t.username}</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                        <input 
                          type="text" 
                          name="username"
                          autoComplete="username"
                          placeholder={t.username} 
                          value={usernameInput} 
                          onChange={(e) => setUsernameInput(e.target.value)} 
                          className="w-full pl-11 pr-4 py-3.5 rounded border border-black/10 focus:ring-2 focus:ring-evans-heritage focus:border-transparent outline-none bg-slate-50/50 transition-all text-evans-earth font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Box with Eye Icon */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-black/50 mb-1.5">{t.password}</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="current-password"
                          placeholder="••••••••" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="w-full pl-11 pr-12 py-3.5 rounded border border-black/10 focus:ring-2 focus:ring-evans-heritage focus:border-transparent outline-none bg-slate-50/50 transition-all text-evans-earth font-medium"
                          required
                        />
                        {/* Toggle Button */}
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-evans-heritage focus:outline-none transition-colors"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100 text-sm font-bold flex items-center gap-2">
                        <XCircle size={16} /> {error}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isSubmitting || !usernameInput || !password} 
                      className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-md"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Secure Login"}
                    </button>
                  </form>
                <div className="flex justify-center"><button onClick={loginWithGoogle} className="text-sm text-slate-500 hover:text-slate-800 underline">{t.googleBtn}</button></div>
              </div>
            </div>
          ) : !activeFolderId ? (
             <div className="h-full flex flex-col items-center justify-center p-8 text-center"><h3 className="text-xl font-bold text-slate-900 mb-2">{t.accessDenied}</h3><p className="text-slate-500">{t.noFolder}</p></div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white p-4 px-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    {currentRequest ? (
                      <button onClick={backToMain} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16} /> {t.backToAll}</button>
                    ) : <span className="text-slate-400 text-sm font-bold">{t.projectFiles}</span>}
                 </div>
                {currentRequest ? (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-700 hidden sm:inline">{t.reviewing}: {currentRequest.name}</span>
                      <button onClick={() => setShowSignModal(true)} className="bg-evans-amber text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-sm animate-pulse"><PenTool size={18} /> {t.sign} "{currentRequest.name}"</button>
                    </div>
                 ) : (
                    requests.length > 0 && <div className="flex gap-2">{requests.map(req => (<button key={req.id} onClick={() => openRequest(req)} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"><FileText size={16} /> {t.review}: {req.name} <ChevronRight size={14}/></button>))}</div>
                 )}
              </div>

              {/* --- LOADING SAFETY NET --- */}
              {!clientData ? (
                <div className="flex flex-col items-center justify-center p-24">
                  <Loader2 className="animate-spin w-10 h-10 text-evans-heritage mb-4" />
                  <p className="text-black/40 font-bold uppercase tracking-widest text-xs">Loading Project Hub...</p>
                </div>
              ) : (
                <>
                  {/* Job Folder Navigation Tabs */}
                  {!currentRequest && clientData?.folders && clientData.folders.length > 0 && (
                    <div className="flex gap-3 p-4 bg-evans-stone border-b border-black/5 overflow-x-auto">
                       {clientData.folders.map(f => (
                          <button 
                             key={f.id}
                             onClick={() => setActiveFolderId(f.folderId)}
                             className={`px-5 py-2.5 rounded font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 border shadow-sm ${activeFolderId === f.folderId ? 'bg-evans-earth text-white border-evans-earth' : 'bg-white text-evans-earth border-black/10 hover:bg-slate-50'}`}
                          >
                             <Folder size={16} className={activeFolderId === f.folderId ? 'text-evans-heritage' : 'text-black/30'} /> 
                             {f.name}
                          </button>
                       ))}
                    </div>
                  )}
                </>
              )}

{/* --- PROJECT DASHBOARD MASTER --- */}
              {(() => {
                // Notice the ?. safety nets here
                const activeFolderObj = clientData?.folders?.find(f => f.folderId === activeFolderId);
                if (!activeFolderObj && !currentRequest) return null;
                
                // Calculate Financials safely
                const budget = Number(activeFolderObj?.budgetTotal) || 0;
                const paid = Number(activeFolderObj?.budgetPaid) || 0;
                const progressPercent = budget > 0 ? Math.min(Math.round((paid / budget) * 100), 100) : 0;

                return activeFolderObj && !currentRequest && (
                  <div className="bg-white border-b border-black/5 flex flex-col">
                     
                     {/* Financial Progress Bar */}
                     {budget > 0 && (
                       <div className="px-6 py-4 bg-slate-50 border-b border-black/5">
                         <div className="flex justify-between items-end mb-2">
                           <div className="flex items-center gap-2 text-evans-earth font-bold text-sm uppercase tracking-wider">
                             <Wallet size={16} className="text-evans-heritage" /> Project Funding
                           </div>
                           <div className="text-sm font-semibold text-black/60">
                             €{paid.toLocaleString()} <span className="font-normal text-black/40">/ €{budget.toLocaleString()}</span>
                           </div>
                         </div>
                         <div className="w-full bg-black/10 rounded-full h-2.5 overflow-hidden">
                           <div className="bg-evans-heritage h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                         </div>
                       </div>
                     )}

                     <div className="p-6 flex flex-col lg:flex-row gap-8 justify-between items-start">
                       {/* Left Column: Status, Admin Note & Site Diary */}
                       <div className="flex flex-col gap-6 flex-1 w-full lg:w-3/5 min-h-0">
                          
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-bold uppercase tracking-widest text-black/40">Phase:</span>
                             <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                               activeFolderObj.status === 'Accepted' || activeFolderObj.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                               activeFolderObj.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                               'bg-evans-stone text-evans-earth border border-black/10'
                             }`}>
                               {activeFolderObj.status || 'Planning'}
                             </span>
                          </div>
                          
                          {activeFolderObj.adminNote && (
                             <div className="text-sm text-evans-earth bg-evans-stone/50 p-4 rounded border border-black/10 flex items-start gap-3 shadow-sm">
                               <MessageSquare size={18} className="mt-0.5 text-evans-heritage shrink-0" />
                               <span className="font-medium leading-relaxed">{activeFolderObj.adminNote}</span>
                             </div>
                          )}

                          {/* Site Diary Timeline (SCROLLABLE VERSION) */}
                          {activeFolderObj?.diary?.length > 0 && (
                            <div className="mt-2 flex flex-col min-h-0">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4 border-b border-black/5 pb-2 shrink-0">Site Diary</h4>
                              
                              {/* --- THIS DIV ADDS THE SCROLLING --- */}
                              <div className="max-h-[400px] overflow-y-auto pr-4">
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/10 before:to-transparent">
                                  {activeFolderObj.diary.map((entry) => (
                                    <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-evans-heritage shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 ml-0 md:ml-auto md:mr-auto"></div>
                                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-black/5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-[10px] font-bold uppercase text-evans-heritage mb-2">{new Date(entry.date).toLocaleDateString()}</div>
                                        
                                        {entry.imgUrl && (
                                          <div className="mb-3 rounded overflow-hidden border border-black/5 shadow-sm">
                                            <img 
                                              src={entry.imgUrl} 
                                              alt="Site Progress" 
                                              className="w-full h-auto object-cover max-h-48" 
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <a href={entry.imgUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline mt-1 block uppercase">Open Photo in Drive &rarr;</a>
                                          </div>
                                        )}
                                        
                                        <p className="text-sm text-evans-earth leading-relaxed">{entry.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          )}
                       </div>

                       {/* Right Column: Approvals, Checklists & Client Notes */}
                       <div className="flex flex-col gap-5 w-full lg:w-2/5 shrink-0 bg-evans-stone/30 p-5 rounded-lg border border-black/5">
                          
                          {/* Approval Box */}
                          {activeFolderObj.status === 'Pending Approval' && !activeFolderObj.approvedAt && (
                              <div className="bg-white p-4 rounded border-2 border-amber-200 shadow-sm">
                                 <p className="text-xs font-bold mb-3 uppercase text-amber-800">Action Required: Quote Approval</p>
                                 <div className="flex gap-2">
                                    <button onClick={() => updateActiveFolder({ approvedAt: new Date().toISOString(), status: 'Accepted' })} className="flex-1 bg-evans-heritage text-white text-sm font-bold py-2.5 rounded hover:bg-[#586751] transition-all"><CheckCircle size={16} className="inline mr-1 mb-0.5"/> Accept</button>
                                    <button onClick={() => updateActiveFolder({ declinedAt: new Date().toISOString() })} className="flex-1 bg-white border border-black/20 text-black/60 text-sm font-bold py-2.5 rounded hover:bg-slate-50 transition-all"><XCircle size={16} className="inline mr-1 mb-0.5"/> Decline</button>
                                 </div>
                              </div>
                          )}
                          {activeFolderObj.approvedAt && (
                              <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                                <CheckCircle size={16} /> Quote Accepted ({new Date(activeFolderObj.approvedAt).toLocaleDateString()})
                              </div>
                          )}

                          {/* Action Required Checklist (SCROLLABLE VERSION) */}
                          {activeFolderObj?.todos?.length > 0 && (
                            <div className="flex flex-col min-h-0">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3 flex items-center gap-2 shrink-0"><ListTodo size={14}/> Action Required</h4>
                              
                              {/* --- THIS DIV ADDS THE SCROLLING --- */}
                              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2">
                                {activeFolderObj.todos.map(todo => (
                                  <div key={todo.id} onClick={() => toggleTodo(todo.id)} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${todo.done ? 'bg-white border-black/5 opacity-60' : 'bg-white border-black/10 shadow-sm hover:border-evans-heritage'}`}>
                                    {todo.done ? <CheckSquare size={18} className="text-evans-heritage mt-0.5 shrink-0" /> : <Square size={18} className="text-black/30 mt-0.5 shrink-0" />}
                                    <span className={`text-sm font-medium ${todo.done ? 'line-through text-black/40' : 'text-evans-earth'}`}>{todo.text}</span>
                                  </div>
                                ))}
                              </div>

                            </div>
                          )}

                          {/* Note to Builder */}
                          <div className="mt-auto pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Send a Message</h4>
                            <div className="flex gap-2">
                                <input type="text" placeholder={activeFolderObj.clientNote || "Type note here..."} className="flex-1 text-sm p-3 border border-black/10 rounded focus:ring-2 focus:ring-evans-heritage outline-none bg-white" value={clientNoteInput} onChange={(e) => setClientNoteInput(e.target.value)} />
                                <button onClick={() => { updateActiveFolder({ clientNote: clientNoteInput }); setClientNoteInput(''); }} disabled={!clientNoteInput} className="bg-evans-earth text-white px-4 rounded text-sm font-bold hover:bg-black/80 disabled:opacity-50">Send</button>
                            </div>
                          </div>

                       </div>
                     </div>
                  </div>
                );
              })()}
              
              {/* The Iframe */}
              <iframe src={`https://drive.google.com/embeddedfolderview?id=${activeFolderId}#grid`} className="w-full flex-1 border-0 bg-slate-50" title="Files"></iframe>
            </div>
          )}
        </div>

        {showSignModal && currentRequest && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-slate-900">{t.sign} {currentRequest.name}</h3>
                <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">{t.signingText} <strong>{currentRequest.name}</strong>.</p>
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none mb-4 overflow-hidden relative h-64"><SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'w-full h-full'}} backgroundColor="rgba(255,255,255,0)" /><div className="absolute bottom-2 right-2 text-xs text-slate-300 pointer-events-none">{t.drawHere}</div></div>
              <div className="flex gap-3"><button onClick={() => sigPad.current.clear()} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 flex justify-center items-center gap-2"><Eraser size={18} /> {t.clear}</button><button onClick={saveSignature} disabled={isSavingSig} className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex justify-center items-center gap-2">{isSavingSig ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {t.confirm}</>}</button></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
