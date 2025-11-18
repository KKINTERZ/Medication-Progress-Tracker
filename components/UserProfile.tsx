
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { UserIcon } from './Icons';

interface UserProfileDisplayProps {
    user: UserProfile;
    onLogout: () => void;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ user, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center space-x-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
            >
                <div className="w-9 h-9 rounded-full bg-brand-gold-light dark:bg-brand-gray-700 flex items-center justify-center text-brand-gold-dark dark:text-brand-gold-light">
                    <UserIcon className="w-6 h-6" />
                </div>
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