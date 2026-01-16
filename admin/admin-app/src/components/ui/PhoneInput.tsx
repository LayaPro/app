import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import styles from './PhoneInput.module.css';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
}

const countries: Country[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxLength: 9 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxLength: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', maxLength: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', maxLength: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', maxLength: 10 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', maxLength: 9 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', maxLength: 10 },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫', maxLength: 9 },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱', maxLength: 9 },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿', maxLength: 9 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', maxLength: 10 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', maxLength: 11 },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', maxLength: 8 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', maxLength: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', maxLength: 11 },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬', maxLength: 9 },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭', maxLength: 9 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', maxLength: 11 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', maxLength: 10 },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷', maxLength: 9 },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', maxLength: 9 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', maxLength: 8 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', maxLength: 10 },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪', maxLength: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', maxLength: 10 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', maxLength: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', maxLength: 11 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', maxLength: 10 },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', maxLength: 8 },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', maxLength: 9 },
  { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸', maxLength: 7 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', maxLength: 11 },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷', maxLength: 10 },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶', maxLength: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', maxLength: 9 },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', maxLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', maxLength: 10 },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', maxLength: 9 },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', maxLength: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', maxLength: 10 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', maxLength: 8 },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻', maxLength: 8 },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', maxLength: 8 },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹', maxLength: 8 },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺', maxLength: 9 },
  { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻', maxLength: 7 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', maxLength: 10 },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', maxLength: 9 },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲', maxLength: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxLength: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', maxLength: 10 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', maxLength: 8 },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', maxLength: 8 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', maxLength: 10 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', maxLength: 9 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', maxLength: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', maxLength: 8 },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', maxLength: 9 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', maxLength: 10 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', maxLength: 9 },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸', maxLength: 9 },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰', maxLength: 9 },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮', maxLength: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', maxLength: 9 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', maxLength: 9 },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', maxLength: 9 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', maxLength: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', maxLength: 10 },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', maxLength: 9 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', maxLength: 10 },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪', maxLength: 9 },
];

// Export countries for use in other components
export { countries };

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  info?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  info,
}) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const infoRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close info tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInfo]);

  // Handle keyboard navigation in dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % filteredCountries.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + filteredCountries.length) % filteredCountries.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCountries[focusedIndex]) {
            handleCountrySelect(filteredCountries[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          break;
        default:
          // Allow typing for search
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setSearchTerm(prev => prev + e.key);
            setFocusedIndex(0);
          } else if (e.key === 'Backspace') {
            setSearchTerm(prev => prev.slice(0, -1));
            setFocusedIndex(0);
          }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchTerm, focusedIndex]);

  // Reset search when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const focusedElement = dropdownRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Parse initial value and update when value changes
  useEffect(() => {
    console.log('PhoneInput received value:', value);
    if (value) {
      // Sort countries by dial code length (longest first) to match correctly
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matchedCountry = sortedCountries.find(c => value.startsWith(c.dialCode));
      console.log('Matched country:', matchedCountry);
      if (matchedCountry) {
        setCountryCode(matchedCountry.dialCode);
        const extractedPhone = value.substring(matchedCountry.dialCode.length);
        console.log('Setting phoneNumber to:', extractedPhone);
        setPhoneNumber(extractedPhone);
      } else {
        console.log('No country matched, setting full value as phone');
        setPhoneNumber(value);
      }
    } else {
      setCountryCode('+91');
      setPhoneNumber('');
    }
  }, [value]);

  const selectedCountry = countries.find(c => c.dialCode === countryCode) || countries[0];
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.dialCode);
    setIsOpen(false);
    setSearchTerm('');
    onChange(country.dialCode + phoneNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Only allow numbers
    if (input && !/^\d+$/.test(input)) {
      return;
    }

    // Check max length for selected country
    if (input.length > selectedCountry.maxLength) {
      return;
    }

    setPhoneNumber(input);
    onChange(countryCode + input);
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        {info && (
          <div className={styles.infoWrapper} ref={infoRef}>
            <button
              type="button"
              className={styles.infoButton}
              onClick={() => setShowInfo(!showInfo)}
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 16v-4" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="8" r="0.5" fill="currentColor" strokeWidth="1" />
              </svg>
            </button>
            {showInfo && (
              <div className={styles.infoTooltip}>
                {info}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.phoneInputWrapper}>
        <div className={styles.countrySelector}>
          <button
            type="button"
            className={styles.countryButton}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={styles.flag}>{selectedCountry.flag}</span>
            <span className={styles.dialCode}>{selectedCountry.dialCode}</span>
            <svg className={styles.chevron} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
              <div className={styles.dropdown} ref={dropdownRef}>
                {searchTerm && (
                  <div className={styles.searchIndicator}>
                    Searching: {searchTerm}
                  </div>
                )}
                {filteredCountries.length === 0 ? (
                  <div className={styles.noResults}>No countries found</div>
                ) : (
                  filteredCountries.map((country, index) => (
                    <button
                      key={country.code}
                      type="button"
                      data-index={index}
                      className={`${styles.countryOption} ${
                        country.dialCode === countryCode ? styles.selected : ''
                      } ${index === focusedIndex ? styles.focused : ''}`}
                      onClick={() => handleCountrySelect(country)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <span className={styles.flag}>{country.flag}</span>
                      <span className={styles.countryName}>{country.name}</span>
                      <span className={styles.dialCodeOption}>{country.dialCode}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.inputWrapper}>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={handleNumberChange}
            placeholder={`Enter ${selectedCountry.maxLength}-digit number`}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
