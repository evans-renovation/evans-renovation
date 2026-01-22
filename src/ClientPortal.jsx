import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, Lock, Loader2, User, PenTool, CheckCircle, Save, Eraser, Folder, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
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

  // Login
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setActiveFolderId(data.folderId);
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
  const backToMain = () => { setCurrentRequest(null); setActiveFolderId(clientData.folderId); };

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
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${lang === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>🇬🇧 EN</button>
              <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${lang === 'fr' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>🇫🇷 FR</button>
            </div>
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
                <form onSubmit={handleLogin} className="space-y-4 mb-8">
                  <input type="text" placeholder={t.username} value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" required />
                  <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" required />
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" /> : t.loginBtn}</button>
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
