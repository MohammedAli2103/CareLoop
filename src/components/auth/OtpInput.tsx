import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => void;
  countdownSeconds?: number;
  disabled?: boolean;
  error?: string | null;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  countdownSeconds = 45,
  disabled = false,
  error = null,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResendClick = () => {
    if (timeLeft > 0 || disabled) return;
    setTimeLeft(countdownSeconds);
    if (onResend) onResend();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const valArray = value.split('');
    while (valArray.length < length) valArray.push('');

    valArray[index] = char;
    const newOtp = valArray.join('').slice(0, length);
    onChange(newOtp);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[i] || ''}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={`w-11 h-12 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 text-rose-700'
                : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 text-slate-800'
            } ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : 'shadow-sm'}`}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-rose-600 font-medium mb-3 text-center">{error}</p>
      )}

      {/* Countdown and Resend */}
      <div className="mt-2 text-sm text-slate-500">
        {timeLeft > 0 ? (
          <span>
            Resend OTP in <strong className="text-slate-800 font-semibold">{formatTimer(timeLeft)}</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={disabled}
            className="text-sky-600 font-semibold hover:text-sky-700 hover:underline transition-colors focus:outline-none"
          >
            Resend OTP Code
          </button>
        )}
      </div>
    </div>
  );
};
