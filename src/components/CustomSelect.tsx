import { useState, useRef, useEffect } from 'react';
import styles from '../styles/customSelect.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  icon,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.isOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.triggerContent}>
          {icon && <i className={`fas ${icon}`}></i>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <i className={`fas fa-chevron-down ${styles.chevronIcon} ${isOpen ? styles.rotate : ''}`}></i>
      </div>

      {isOpen && (
        <div className={styles.menu}>
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`${styles.item} ${value === option.value ? styles.selected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
              {value === option.value && <i className="fas fa-check"></i>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
