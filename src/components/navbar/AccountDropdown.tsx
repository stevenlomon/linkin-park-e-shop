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
        <div className="absolute right-0 z-50 mt-4 w-72 border border-line bg-surface p-5 shadow-2xl">
          {user ? (
            <>
              <p className="lp-eyebrow mb-1">
                Hej {user.role_name === 'admin' ? 'Admin' : user.username}!
              </p>
              <p className="mb-5 text-xs text-muted">{user.email}</p>

              <LogoutButton />
            </>
          ) : (
            <LoginForm />
          )}
        </div>
      )}
    </div>
  )
};
