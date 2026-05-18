import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  style?: CSSProperties;
};

export default function LoadingButton({
  isLoading = false,
  loadingText = 'Memproses...',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      className={`${className} ${isLoading ? 'isButtonLoading' : ''}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <i className="fa-solid fa-spinner fa-spin loadingButtonSpinner"></i>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
