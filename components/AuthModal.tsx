
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SpinnerIcon, UploadIcon } from './Icons';
import Logo from './Logo';
import { auth, storage } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => void;
  initialMode?: 'login' | 'signup' | 'edit-profile';
  currentUser?: UserProfile | null;
  onUpdate?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onGoogleLogin, initialMode = 'login', currentUser, onUpdate }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'edit-profile'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isOpen) {
          setMode(initialMode);
          setError('');
          setResetSent(false);
          
          if (initialMode === 'edit-profile' && currentUser) {
              setName(currentUser.name || '');
              setEmail(currentUser.email || '');
              setPhotoPreview(currentUser.picture || null);
              setPhotoFile(null);
              setPassword(''); // Password not required for simple profile update
          } else {
              setEmail('');
              setPassword('');
              setRepeatPassword('');
              setName('');
              setPhotoFile(null);
              setPhotoPreview(null);
          }
      }
  }, [isOpen, initialMode, currentUser]);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'forgot-password') {
          if (!email) throw new Error('Please enter your email address');
          await sendPasswordResetEmail(auth, email);
          setResetSent(true);
          setIsLoading(false);
          return;
      }

      if (mode === 'edit-profile') {
          if (!auth.currentUser) throw new Error('No user logged in');
          if (!name.trim()) throw new Error('Please enter your name');

          let photoURL = auth.currentUser.photoURL;
          
          if (photoFile) {
              const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}`);
              await uploadBytes(storageRef, photoFile);
              photoURL = await getDownloadURL(storageRef);
          }

          await updateProfile(auth.currentUser, {
              displayName: name,
              photoURL: photoURL
          });

          if (onUpdate) onUpdate();
          else onClose();
          return;
      }

      // Basic validation for login/signup
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      if (mode === 'signup') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (password !== repeatPassword) throw new Error('Passwords do not match');
        if (!name) throw new Error('Please enter your name');
      }

      if (mode === 'login') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          onClose();
        } catch (err: any) {
          const errorCode = err.code;
          if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-email') {
            throw new Error('Password or Email Incorrect');
          }
          throw err;
        }
      } else if (mode === 'signup') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          let photoURL = '';
          if (photoFile) {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
          }

          await updateProfile(user, {
            displayName: name,
            photoURL: photoURL || null
          });
          
          onClose();
        } catch (err: any) {
          const errorCode = err.code;
          if (errorCode === 'auth/email-already-in-use') {
             setError("User already exists. Sign in?");
             setIsLoading(false);
             return; 
          }
          throw err;
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      if (mode !== 'forgot-password' && error !== "User already exists. Sign in?") setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot-password') => {
      setMode(newMode);
      setError('');
      setResetSent(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none z-10"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="p-8">
            {mode === 'forgot-password' && resetSent ? (
                <div className="text-center">
                     <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100 mb-2">Check your email</h2>
                    <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mb-6">
                        We've sent password reset instructions to <strong>{email}</strong>.
                    </p>
                    <button
                        onClick={() => switchMode('login')}
                        className="w-full bg-brand-gold-dark hover:bg-brand-success-dark text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-gold-dark/30"
                    >
                        Back to Log In
                    </button>
                </div>
            ) : (
                <>
                  <div className="text-center mb-6">
                    <Logo className="h-12 w-12 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
                      {mode === 'login' ? 'Welcome Back' : (mode === 'signup' ? 'Create Account' : (mode === 'edit-profile' ? 'Edit Profile' : 'Reset Password'))}
                    </h2>
                    <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mt-1">
                      {mode === 'login' ? 'Sign in to continue tracking' : (mode === 'signup' ? 'Start your journey to better health' : (mode === 'edit-profile' ? 'Update your profile information' : 'Enter your email to receive instructions'))}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {(mode === 'signup' || mode === 'edit-profile') && (
                      <>
                         <div className="flex justify-center mb-4">
                            <div 
                                className="relative w-24 h-24 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700 border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand-gold-DEFAULT transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-brand-gray-400">
                                        <UploadIcon className="w-6 h-6 mb-1" />
                                        <span className="text-[10px]">Photo</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePhotoChange} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Full Name</label>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                            placeholder="John Doe"
                            />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={mode === 'edit-profile'}
                        className={`w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all ${mode === 'edit-profile' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="you@example.com"
                      />
                    </div>

                    {mode !== 'forgot-password' && mode !== 'edit-profile' && (
                        <>
                            <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Password</label>
                                {mode === 'login' && (
                                    <button 
                                        type="button"
                                        onClick={() => switchMode('forgot-password')}
                                        className="text-xs text-brand-gold-dark dark:text-brand-gold-DEFAULT hover:underline focus:outline-none"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                            </div>
                            
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Repeat Password</label>
                                    <input
                                        type="password"
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
                        {error === "User already exists. Sign in?" ? (
                             <span>
                                 User already exists. <button onClick={() => switchMode('login')} className="underline font-bold hover:text-red-800 dark:hover:text-red-200">Sign in?</button>
                             </span>
                        ) : error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-brand-gold-dark hover:bg-brand-success-dark text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-gold-dark/30"
                    >
                      {isLoading ? (
                        <>
                          <SpinnerIcon className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{mode === 'login' ? 'Sign In' : (mode === 'signup' ? 'Create Account' : (mode === 'edit-profile' ? 'Save Changes' : 'Send Reset Link'))}</span>
                      )}
                    </button>
                  </form>
                
                {mode !== 'forgot-password' && mode !== 'edit-profile' && (
                    <div className="mt-6">
                        <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-brand-gray-800 text-brand-gray-500 dark:text-brand-gray-400">Or continue with</span>
                        </div>
                        </div>

                        <button
                        type="button"
                        onClick={onGoogleLogin}
                        className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-brand-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                        >
                        <img 
                            src="https://iili.io/fduVidb.png" 
                            alt="Google" 
                            className="w-5 h-5" 
                            onError={(e) => {
                                e.currentTarget.src = "https://www.svgrepo.com/show/475656/google-color.svg";
                            }}
                        />
                        <span className="font-medium">Sign in with Google</span>
                        </button>
                    </div>
                )}

                  <div className="mt-6 text-center">
                      {mode === 'forgot-password' ? (
                           <button
                            onClick={() => switchMode('login')}
                            className="text-sm text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-900 dark:hover:text-brand-gray-200 font-medium focus:outline-none"
                          >
                            Back to Log In
                          </button>
                      ) : (mode !== 'edit-profile' && (
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                          <button
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-brand-gold-dark dark:text-brand-gold-DEFAULT font-semibold hover:underline focus:outline-none"
                          >
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                          </button>
                        </p>
                      ))}
                  </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
