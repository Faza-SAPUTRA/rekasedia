import { useState, useRef, useEffect } from 'react';
import styles from '../styles/customSelect.module.css';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | { label: string; value: string })[];
  className?: string;
}

export default function CustomSelect({ value, onChange, options, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedLabel = typeof options[0] === 'string'
    ? value
    : (options as { label: string; value: string }[]).find(opt => opt.value === value)?.label || value;

  return (
    <div className={`${styles.selectContainer} ${className}`} ref={containerRef}>
      <div 
        className={`${styles.selectTrigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <i className="fas fa-chevron-down"></i>
      </div>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownInner}>
            {options.map((opt, i) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isActive = optValue === value;
              
              return (
                <div
                  key={i}
                  className={`${styles.dropdownItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                >
                  {optLabel}
                  {isActive && <i className="fas fa-check"></i>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
