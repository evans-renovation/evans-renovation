import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut, Lock, ExternalLink, Loader2, User, PenTool, CheckCircle, Save, Eraser } from 'lucide-react';
import { auth, db, loginWithGoogle, loginWithEmail, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import SignatureCanvas from 'react-signature-canvas';

const PORTAL_DOMAIN = "@evans-portal.com"; 

export default function ClientPortal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Database Fields
  const [folderId, setFolderId] = useState(null);
  const [signedData, setSignedData] = useState(null); // Stores signature info if signed
  
  // Signature UI States
  const [showSignModal, setShowSignModal] = useState(false);
  const sigPad = useRef({});
  const [isSavingSig, setIsSavingSig] = useState(false);

  // Login Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchClientData(currentUser.email);
      } else {
        setFolderId(null);
        setSignedData(null);
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
        setFolderId(data.folderId);
        // Check if they already signed
        if (data.signature) {
          setSignedData(data.signature);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    let finalEmail = usernameInput.trim();
    if (!finalEmail.includes('@')) finalEmail = finalEmail + PORTAL_DOMAIN;

    try {
      await loginWithEmail(finalEmail, password);
    } catch (err) {
      setError("Incorrect username or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSignature = async () => {
    if (sigPad.current.isEmpty()) {
      alert("Please draw your signature first.");
      return;
    }

    setIsSavingSig(true);
    try {
      const signatureImage = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      const timestamp = new Date().toISOString();
      const signRecord = {
        signedAt: timestamp,
        image: signatureImage,
        signer: user.email
      };

      // Save to Firestore
      const docRef = doc(db, "clients", user.email);
      await updateDoc(docRef, {
        signature: signRecord
      });

      setSignedData(signRecord);
      setShowSignModal(false);
      alert("Quote signed successfully!");
    } catch (error) {
      console.error("Error saving signature:", error);
      alert("Error saving signature. Please try again.");
    } finally {
      setIsSavingSig(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]">
        <X size={32} />
      </button>

      <div className="bg-white w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl h-[85vh] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <Lock className="text-evans-amber" size={24} />
            <h2 className="font-serif text-xl">Espace Client</h2>
          </div>
          {user && (
            <button onClick={logout} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
              Sign Out <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin w-8 h-8" /></div>
          ) : !user ? (
            // --- LOGIN SCREEN (Same as before) ---
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-sm">
                 <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600"><User size={32} /></div>
                  <h3 className="text-2xl font-serif text-slate-900">Client Login</h3>
                </div>
                <form onSubmit={handleLogin} className="space-y-4 mb-8">
                  <div>
                    <input type="text" placeholder="Username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" required />
                  </div>
                  <div>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-amber-500" required />
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Log In"}
                  </button>
                </form>
                <div className="flex justify-center"><button onClick={loginWithGoogle} className="text-sm text-slate-500 hover:text-slate-800 underline">Or sign in with Google</button></div>
              </div>
            </div>
          ) : !folderId ? (
             <div className="h-full flex flex-col items-center justify-center p-8 text-center">
               <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
               <p className="text-slate-500">User <strong>{user.email.replace(PORTAL_DOMAIN, '')}</strong> is not linked to a folder.</p>
             </div>
          ) : (
            // --- MAIN DASHBOARD ---
            <div className="h-full flex flex-col">
              
              {/* ACTION BAR */}
              <div className="bg-white p-4 px-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <p className="text-slate-600 text-sm">
                  Project: <span className="font-bold text-slate-900 capitalize">{user.email.split('@')[0].replace('project-', '')}</span>
                </p>

                {/* SIGNATURE STATUS */}
                {signedData ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                    <CheckCircle size={18} />
                    <span className="text-sm font-bold">Quote Signed on {new Date(signedData.signedAt).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSignModal(true)}
                    className="bg-evans-amber text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-sm animate-pulse"
                  >
                    <PenTool size={18} /> Review & Sign Quote
                  </button>
                )}
              </div>

              {/* FOLDER FRAME */}
              <iframe src={`https://drive.google.com/embeddedfolderview?id=${folderId}#grid`} className="w-full flex-1 border-0 bg-slate-50" title="Client Files"></iframe>
            </div>
          )}
        </div>

        {/* --- SIGNATURE MODAL OVERLAY --- */}
        {showSignModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-slate-900">Sign Quote</h3>
                <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              
              <p className="text-sm text-slate-500 mb-4">
                By signing below, I confirm that I have read the quote in the folder and accept the terms (Bon pour accord).
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none mb-4 overflow-hidden relative">
                 <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{className: 'w-full h-full'}}
                    backgroundColor="rgba(255,255,255,0)"
                 />
                 <div className="absolute bottom-2 right-2 text-xs text-slate-300 pointer-events-none">Draw here</div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => sigPad.current.clear()} 
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 flex justify-center items-center gap-2"
                >
                  <Eraser size={18} /> Clear
                </button>
                <button 
                  onClick={saveSignature} 
                  disabled={isSavingSig}
                  className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex justify-center items-center gap-2"
                >
                  {isSavingSig ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Confirm Signature</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
