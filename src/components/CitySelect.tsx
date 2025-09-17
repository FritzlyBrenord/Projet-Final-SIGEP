import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { allCities, searchCities } from '../utils/haiti-cities';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isDarkMode?: boolean;
  required?: boolean;
}

const CitySelect: React.FC<CitySelectProps> = ({
  value,
  onChange,
  placeholder = "Sélectionnez ou tapez une ville",
  className = "",
  isDarkMode = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>(allCities);
  const [showAddNew, setShowAddNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const dropdownClasses = isDarkMode
    ? "bg-gray-800 border-gray-600 text-white"
    : "bg-white border-gray-300 text-gray-900";

  const optionClasses = isDarkMode
    ? "hover:bg-gray-700 text-white"
    : "hover:bg-gray-100 text-gray-900";

  // Valeur affichée dans l'input
  const displayValue = isOpen ? searchTerm : value;

  useEffect(() => {
    const results = searchCities(searchTerm);
    setFilteredCities(results);
    setShowAddNew(searchTerm.length > 2 && !results.some(city => city.toLowerCase() === searchTerm.toLowerCase()));
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowAddNew(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearchTerm("");
    setShowAddNew(false);
  };

  const handleAddNewCity = () => {
    if (searchTerm.trim()) {
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm("");
      setShowAddNew(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className={`block text-sm font-medium mb-2 ${
        isDarkMode ? "text-gray-300" : "text-gray-700"
      }`}>
        Lieu de Naissance
      </label>

      {/* Input de recherche */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleSearchChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg pr-10 cursor-pointer ${inputClasses}`}
          autoComplete="off"
        />

        {/* Icône de dropdown */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownClasses}`}>
          <div className="max-h-48 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <button
                  key={`${city}-${index}`}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm ${optionClasses} ${
                    value === city ? (isDarkMode ? "bg-blue-700" : "bg-blue-100") : ""
                  }`}
                  onClick={() => handleSelect(city)}
                >
                  {city}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                Aucune ville trouvée
              </div>
            )}

            {showAddNew && (
              <div className="border-t border-gray-200 dark:border-gray-600 p-2">
                <button
                  type="button"
                  onClick={handleAddNewCity}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    Ajouter "{searchTerm}"
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {required && (
        <input
          type="hidden"
          value={value}
          required
        />
      )}
    </div>
  );
};

export default CitySelect;