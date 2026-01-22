import React, { useState, useEffect } from 'react';
import { X, LogOut, FolderOpen, Lock, ExternalLink, Loader2, User } from 'lucide-react';
import { auth, loginWithGoogle, loginWithEmail, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURATION ---
// 1. Define the "invisible" domain for usernames
const PORTAL_DOMAIN = "@evans-portal.com";

const CLIENT_FOLDERS = {
  // GOOGLE LOGINS (Full Emails)
  "cameron@evansrenovation.fr": "YOUR_FOLDER_ID",

  // USERNAME LOGINS (Must end with the PORTAL_DOMAIN above)
  // If username is "smith", map key is "smith@evans-portal.com"
  [`smith${PORTAL_DOMAIN}`]: "FOLDER_ID_FOR_SMITH",
  [`jones${PORTAL_DOMAIN}`]: "FOLDER_ID_FOR_JONES"
};

export default function ClientPortal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folderId, setFolderId] = useState(null);
  
  // Login Form States
  const [usernameInput, setUsernameInput] = useState(''); // Changed from 'email'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && CLIENT_FOLDERS[currentUser.email]) {
        setFolderId(CLIENT_FOLDERS[currentUser.email]);
      } else {
        setFolderId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // LOGIC: Check if they typed an email or just a username
    let finalEmail = usernameInput.trim();
    if (!finalEmail.includes('@')) {
      // It's a username! Add the invisible domain.
      finalEmail = finalEmail + PORTAL_DOMAIN;
    }

    try {
      await loginWithEmail(finalEmail, password);
    } catch (err) {
      console.error(err);
      setError("Incorrect username or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
        <X size={32} />
      </button>

      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
        
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
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : !user ? (
            // --- LOGIN SCREEN ---
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                    <User size={32} />
                  </div>
                  <h3 className="text-2xl font-serif text-slate-900">Client Login</h3>
                </div>

                {/* Username/Password Form */}
                <form onSubmit={handleLogin} className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g. smith"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  
                  {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Log In"}
                  </button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-50 text-slate-500">Or use Google</span></div>
                </div>

                <div className="mt-6">
                  <button onClick={loginWithGoogle} className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition-all flex justify-center items-center gap-2">
                    <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
                    Sign in with Google
                  </button>
                </div>
              </div>
            </div>
          ) : !folderId ? (
             // --- NO FOLDER FOUND ---
             <div className="h-full flex flex-col items-center justify-center p-8 text-center">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
                 <Lock size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
               <p className="text-slate-500 mb-6">
                 User <strong>{user.email.replace(PORTAL_DOMAIN, '')}</strong> is not linked to a folder.
               </p>
               <button 
                  onClick={logout}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  Sign Out
                </button>
             </div>
          ) : (
            // --- FOLDER VIEW ---
            <div className="h-full flex flex-col">
              <div className="bg-amber-50 p-4 px-6 flex justify-between items-center border-b border-amber-100">
                <p className="text-amber-900 text-sm font-medium">
                  Welcome, <span className="font-bold capitalize">{user.email.split('@')[0].replace('project-', '')}</span>
                </p>
                <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noreferrer" className="text-amber-700 hover:text-amber-900 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  Open in Drive <ExternalLink size={14} />
                </a>
              </div>
              
              <iframe src={`https://drive.google.com/embeddedfolderview?id=${folderId}#grid`} className="w-full flex-1 border-0" title="Client Files"></iframe>
              
              <p className="text-center text-xs text-slate-400 py-2 bg-slate-50">
                Preview not loading? <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" className="underline hover:text-slate-600">Open directly in Google Drive</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
