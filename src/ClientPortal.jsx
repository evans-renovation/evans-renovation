import React, { useState, useEffect } from 'react';
import { X, LogOut, FolderOpen, Lock, ExternalLink, Loader2 } from 'lucide-react';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- CLIENT LIST: Email -> Google Drive Folder ID ---
const CLIENT_FOLDERS = {
  "cameron@evansrenovation.fr": "REPLACE_WITH_FOLDER_ID",
  "client@gmail.com": "REPLACE_WITH_FOLDER_ID"
};

export default function ClientPortal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folderId, setFolderId] = useState(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white">
        <X size={32} />
      </button>

      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
            <Lock className="text-evans-amber" size={24} />
            <h2 className="font-serif text-xl">Client Portal</h2>
          </div>
          {user && (
            <button onClick={logout} className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
              Sign Out <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 bg-slate-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : !user ? (
            // Not Logged In
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-amber-600">
                <FolderOpen size={32} />
              </div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">Access Project Files</h3>
              <p className="text-slate-500 mb-8 max-w-md">Sign in with your Google Account to view plans and photos.</p>
              <button onClick={loginWithGoogle} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-lg font-bold flex items-center gap-3 shadow-sm">
                Sign in with Google
              </button>
            </div>
          ) : !folderId ? (
             // Logged In, No Folder
             <div className="h-full flex flex-col items-center justify-center p-8 text-center">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
                 <Lock size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">No Project Found</h3>
               <p className="text-slate-500">We couldn't find a folder linked to <strong>{user.email}</strong>.</p>
             </div>
          ) : (
            // Success
            <iframe 
              src={`https://drive.google.com/embeddedfolderview?id=${folderId}#grid`}
              className="w-full h-full min-h-[500px] border-0"
              title="Client Files"
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
}
