'use client'

import { useEffect, useRef, useState } from 'react'
import { type CurrentUser } from '@/lib/types'
import LoginForm from './LoginForm'
import LogoutButton from './LogoutButton'

interface AccountDropdownProps {
  user: CurrentUser | null;
}

export default function AccountDropdown({ user }: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup='true'
        aria-label={user ? `Inloggad som ${user.username}` : 'Logga in'}
        className="lp-nav-link flex items-center gap-2"
      >
        <svg
          aria-hidden='true'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          className="h-5 w-5"
        >
          <circle cx='12' cy='8' r='4' />
          <path d='M4 21c0-4 3.6-6 8-6s8 2 8 6' strokeLinecap='round' />
        </svg>

        {user && (
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden='true' />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-4 w-80 border border-line bg-surface p-5 shadow-2xl">
          {user ? (
            <>
              <p className="lp-eyebrow mb-1">
                Hej {user.role_name === 'admin' ? 'Admin' : user.username}!
              </p>
              <p className="mb-5 text-xs text-muted">{user.email}</p>

              <LogoutButton />
            </>
          ) : (
            <>
              <a
                href="/api/auth/google"
                className="lp-btn-primary flex w-full items-center justify-center gap-2 py-2.5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Logga in med Google
              </a>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs text-muted">eller</span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <LoginForm />
            </>
          )}
        </div>
      )}
    </div>
  )
};
