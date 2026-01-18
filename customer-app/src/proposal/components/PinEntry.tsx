import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import './PinEntry.css';

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const PinEntry = ({ onSubmit, isLoading = false, error }: PinEntryProps) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (index === 3 && value && newPin.every(digit => digit !== '')) {
      onSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    if (e.key === 'Enter' && pin.every(digit => digit !== '')) {
      onSubmit(pin.join(''));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      inputRefs[3].current?.focus();
      onSubmit(pastedData);
    }
  };

  const handleSubmit = () => {
    if (pin.every(digit => digit !== '')) {
      onSubmit(pin.join(''));
    }
  };

  return (
    <div className="pin-entry-overlay">
      <div className="pin-entry-container">
        <div className="pin-entry-card">
          <div className="pin-entry-header">
            <div className="pin-lock-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15v2" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="pin-entry-title">Enter Access PIN</h1>
            <p className="pin-entry-subtitle">Please enter your 4-digit PIN to view the proposal</p>
          </div>

          <div className="pin-inputs-container">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`pin-input ${error ? 'pin-input-error' : ''}`}
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="pin-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 8v4" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            className="pin-submit-button"
            onClick={handleSubmit}
            disabled={isLoading || !pin.every(digit => digit !== '')}
          >
            {isLoading ? (
              <>
                <div className="pin-spinner"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M13 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Continue</span>
              </>
            )}
          </button>

          <div className="pin-help-text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
            <span>Check your email or contact us if you don't have the PIN</span>
          </div>
        </div>

        <div className="pin-decoration-left"></div>
        <div className="pin-decoration-right"></div>
      </div>
    </div>
  );
};
