
// FIX: Add type definitions for the Google Identity Services (GSI) library
// to resolve TypeScript errors about the 'google' namespace not being found.
// The GSI library is loaded from a script and attaches the `google` object
// to the `window`, so these types inform TypeScript about its structure.
declare global {
    namespace google {
        interface CredentialResponse {
            credential?: string;
            select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'button' | 'api' | 'cancel' | 'opt_out' | 'close';
            clientId?: string;
        }

        namespace accounts {
            namespace id {
                function initialize(config: { client_id: string; callback: (response: CredentialResponse) => void; }): void;
                function renderButton(
                    parent: HTMLElement,
                    options: {
                        theme?: 'outline' | 'filled_black';
                        size?: 'small' | 'medium' | 'large';
                        type?: 'standard' | 'icon';
                        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                        [key: string]: unknown;
                    }
                ): void;
            }
        }
    }
    interface Window {
        google?: typeof google;
    }
}

import React, { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../config';

interface GoogleSignInButtonProps {
    onLogin: (response: google.CredentialResponse) => void;
    theme: 'light' | 'dark';
    options?: {
        theme?: 'outline' | 'filled_black';
        size?: 'small' | 'medium' | 'large';
        type?: 'standard' | 'icon';
        text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
        [key: string]: unknown;
    }
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onLogin, theme, options = {} }) => {
    const googleButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Prevent re-rendering if the button is already there to avoid issues with the GSI library.
        if (googleButtonRef.current && googleButtonRef.current.childElementCount === 0) {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: onLogin,
                });
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { 
                        theme: theme === 'light' ? 'outline' : 'filled_black', 
                        size: 'medium',
                        ...options
                    }
                );
            }
        }
    }, [onLogin, theme, options]);

    return <div ref={googleButtonRef} className="inline-block" />;
};

export default GoogleSignInButton;
