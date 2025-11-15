import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SwitchAccountIcon, LogoutIcon } from './Icons';

interface UserProfileDisplayProps {
    user: UserProfile | null;
    onLogin: (response: google.CredentialResponse) => void;
    onLogout: () => void;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ user, onLogin, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // If there is no user, this component renders nothing.
    // The login prompt (with the button) is now handled by the App component.
    if (!user) {
        return null;
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
                            className="w-full text-left px-4 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 flex items-center gap-x-2"
                            role="menuitem"
                        >
                            <SwitchAccountIcon className="w-5 h-5" />
                            <span>Switch Account</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-x-2"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileDisplay;