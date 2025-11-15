import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../types';
import { MoonIcon, SunIcon } from './Icons';

interface UserProfileDisplayProps {
    user: UserProfile | null;
    onLogin: (response: google.CredentialResponse) => void;
    onLogout: () => void;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ user, onLogin, onLogout }) => {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Local state for button theme

    useEffect(() => {
        // Set theme based on document class for button rendering
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        setTheme(currentTheme);

        // Render the button if the user is not logged in and the container is empty.
        // Assumes google.accounts.id.initialize has already been called in the App component.
        if (!user && googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: currentTheme === 'light' ? 'outline' : 'filled_black', size: 'medium', type: 'standard', text: 'signin_with' }
                );
            }
        }
    }, [user, onLogin]);

    if (!user) {
        return <div ref={googleButtonRef} />;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center space-x-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
            >
                <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full" />
                <span className="hidden sm:inline font-medium text-brand-gray-700 dark:text-brand-gray-200">{user.name}</span>
            </button>
            {isDropdownOpen && (
                <div 
                    className="origin-top-right absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-brand-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        <div className="px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 border-b border-brand-gray-200 dark:border-brand-gray-600">
                            <p className="font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                            role="menuitem"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileDisplay;