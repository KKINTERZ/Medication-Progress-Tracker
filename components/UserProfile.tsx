
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SwitchAccountIcon, LogoutIcon, UserIcon, EditIcon, TrashIcon } from './Icons';

interface UserProfileDisplayProps {
    user: UserProfile | null;
    onLogout: () => void;
    onEditProfile: () => void;
    onDeleteAccount: () => void;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ user, onLogout, onEditProfile, onDeleteAccount }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
                {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border border-brand-gray-200 dark:border-brand-gray-600" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-gold-light dark:bg-brand-gray-700 flex items-center justify-center border border-brand-gold-DEFAULT/30">
                        <UserIcon className="w-5 h-5 text-brand-gold-dark dark:text-brand-gold-light" />
                    </div>
                )}
                <span className="hidden sm:inline font-medium text-brand-gray-700 dark:text-brand-gray-200">{user.name}</span>
            </button>
            {isDropdownOpen && (
                <div 
                    className="origin-top-right absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-brand-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        <div className="px-4 py-3 text-sm text-brand-gray-700 dark:text-brand-gray-200 border-b border-brand-gray-200 dark:border-brand-gray-600 mb-1">
                            <p className="font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                onEditProfile();
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 flex items-center gap-x-2 transition-colors"
                            role="menuitem"
                        >
                            <EditIcon className="w-4 h-4" />
                            <span>Edit Profile</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 flex items-center gap-x-2 transition-colors"
                            role="menuitem"
                        >
                            <SwitchAccountIcon className="w-4 h-4" />
                            <span>Switch Account</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-x-2 transition-colors"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                        
                        <div className="border-t border-brand-gray-100 dark:border-brand-gray-600 mt-1 pt-1">
                             <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsDeleteConfirmOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-x-2 transition-colors"
                                role="menuitem"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete Account</span>
                            </button>
                         </div>
                    </div>
                </div>
            )}

             {isDeleteConfirmOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                            <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-gray-900 dark:text-brand-gray-100 mb-2">Delete Account</h3>
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-6">
                            Are you sure you want to delete your account? This will permanently remove all your data, including medication history and files. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-brand-gray-700 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-600 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteAccount();
                                    setIsDeleteConfirmOpen(false);
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileDisplay;
