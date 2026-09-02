'use client'

export default function LoginPrompt() {
  function focusLogin() {
    document.getElementById('username')?.focus();
  }

  return (
    <button type='button' onClick={focusLogin} className="lp-btn-primary">
      Logga in
    </button>
  )
};
