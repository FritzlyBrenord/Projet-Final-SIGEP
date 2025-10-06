import React, { useState, useRef, useEffect } from "react";

interface LocationSelectProps {
  value: {
    pays: string;
    region: string;
    ville: string;
    section: any;
  };
  onChange: (value: {
    pays: string;
    region: string;
    ville: string;
    section: any;
  }) => void;
  isDarkMode?: boolean;
  required?: boolean;
}

interface LocationOption {
  value: string;
  label: string;
  geonameId: string;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  onChange,
  isDarkMode = false,
  required = false,
}) => {
  // États pour les dropdowns
  const [isPaysOpen, setIsPaysOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isVilleOpen, setIsVilleOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  // États pour les recherches
  const [paysSearch, setPaysSearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [villeSearch, setVilleSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

  // États pour les options
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [sections, setSections] = useState<LocationOption[]>([]);

  // États pour les IDs GeoNames
  const [paysId, setPaysId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [villeId, setVilleId] = useState("");

  // État pour tracker si les données ont été initialisées
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const paysRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const villeRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME || "demo";

  // Classes CSS
  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const dropdownClasses = isDarkMode
    ? "bg-gray-800 border-gray-600 text-white"
    : "bg-white border-gray-300 text-gray-900";

  const optionClasses = isDarkMode
    ? "hover:bg-gray-700 text-white"
    : "hover:bg-gray-100 text-gray-900";

  // Charger les pays au démarrage
  useEffect(() => {
    fetch(
      `http://api.geonames.org/countryInfoJSON?username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.geonames) {
          const options = data.geonames.map((c: any) => ({
            value: c.countryName,
            label: c.countryName,
            geonameId: c.geonameId,
          }));
          setCountries(options);

          // Si un pays est déjà sélectionné, trouver son ID
          if (value.pays && !isInitialized) {
            const selectedCountry = options.find(
              (opt: LocationOption) => opt.value === value.pays
            );
            if (selectedCountry) {
              setPaysId(selectedCountry.geonameId);
            }
          }
        }
      })
      .catch((err) => console.error("Erreur chargement pays:", err));
  }, [isInitialized, username, value.pays]);

  // Charger les régions quand paysId change
  useEffect(() => {
    if (!paysId) return;

    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${paysId}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.geonames) {
          const options = data.geonames.map((r: any) => ({
            value: r.name,
            label: r.name,
            geonameId: r.geonameId,
          }));
          setRegions(options);

          // Si une région est déjà sélectionnée, trouver son ID
          if (value.region && !isInitialized) {
            const selectedRegion = options.find(
              (opt: LocationOption) => opt.value === value.region
            );
            if (selectedRegion) {
              setRegionId(selectedRegion.geonameId);
            }
          }
        }
      })
      .catch((err) => console.error("Erreur chargement régions:", err));
  }, [isInitialized, paysId, username, value.region]);

  // Charger les villes quand regionId change
  useEffect(() => {
    if (!regionId) return;

    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${regionId}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.geonames) {
          const options = data.geonames.map((v: any) => ({
            value: v.name,
            label: v.name,
            geonameId: v.geonameId,
          }));
          setCities(options);

          // Si une ville est déjà sélectionnée, trouver son ID
          if (value.ville && !isInitialized) {
            const selectedCity = options.find(
              (opt: LocationOption) => opt.value === value.ville
            );
            if (selectedCity) {
              setVilleId(selectedCity.geonameId);
            }
          }
        }
      })
      .catch((err) => console.error("Erreur chargement villes:", err));
  }, [isInitialized, regionId, username, value.ville]);

  // Charger les sections quand villeId change
  useEffect(() => {
    if (!villeId) return;

    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${villeId}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.geonames) {
          const options = data.geonames.map((s: any) => ({
            value: s.name,
            label: s.name,
            geonameId: s.geonameId,
          }));
          setSections(options);

          // Marquer comme initialisé après le chargement des sections
          if (!isInitialized) {
            setIsInitialized(true);
          }
        }
      })
      .catch((err) => console.error("Erreur chargement sections:", err));
  }, [isInitialized, username, villeId]);

  // Gérer les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paysRef.current && !paysRef.current.contains(event.target as Node)) {
        setIsPaysOpen(false);
        setPaysSearch("");
      }
      if (
        regionRef.current &&
        !regionRef.current.contains(event.target as Node)
      ) {
        setIsRegionOpen(false);
        setRegionSearch("");
      }
      if (
        villeRef.current &&
        !villeRef.current.contains(event.target as Node)
      ) {
        setIsVilleOpen(false);
        setVilleSearch("");
      }
      if (
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node)
      ) {
        setIsSectionOpen(false);
        setSectionSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrer les options
  const filteredCountries = countries.filter((c) =>
    c.label.toLowerCase().includes(paysSearch.toLowerCase())
  );
  const filteredRegions = regions.filter((r) =>
    r.label.toLowerCase().includes(regionSearch.toLowerCase())
  );
  const filteredCities = cities.filter((v) =>
    v.label.toLowerCase().includes(villeSearch.toLowerCase())
  );
  const filteredSections = sections.filter((s) =>
    s.label.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  // Handlers
  const handlePaysSelect = (option: LocationOption) => {
    setPaysId(option.geonameId);
    onChange({
      pays: option.value,
      region: "",
      ville: "",
      section: "",
    });
    setRegionId("");
    setVilleId("");
    setRegions([]);
    setCities([]);
    setSections([]);
    setIsPaysOpen(false);
    setPaysSearch("");
  };

  const handleRegionSelect = (option: LocationOption) => {
    setRegionId(option.geonameId);
    onChange({
      ...value,
      region: option.value,
      ville: "",
      section: "",
    });
    setVilleId("");
    setCities([]);
    setSections([]);
    setIsRegionOpen(false);
    setRegionSearch("");
  };

  const handleVilleSelect = (option: LocationOption) => {
    setVilleId(option.geonameId);
    onChange({
      ...value,
      ville: option.value,
      section: "",
    });
    setSections([]);
    setIsVilleOpen(false);
    setVilleSearch("");
  };

  const handleSectionSelect = (option: LocationOption) => {
    onChange({
      ...value,
      section: option.value,
    });
    setIsSectionOpen(false);
    setSectionSearch("");
  };

  const renderDropdown = (
    ref: React.RefObject<HTMLDivElement | null>,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    displayValue: string,
    placeholder: string,
    filteredOptions: LocationOption[],
    onSelect: (option: LocationOption) => void,
    label: string,
    disabled: boolean = false
  ) => (
    <div className="relative" ref={ref}>
      <label
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchValue : displayValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-3 border rounded-lg pr-10 cursor-pointer ${inputClasses} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          autoComplete="off"
        />
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

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownClasses}`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={`${option.geonameId}-${index}`}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${optionClasses} ${
                  displayValue === option.value
                    ? isDarkMode
                      ? "bg-blue-700"
                      : "bg-blue-100"
                    : ""
                }`}
                onClick={() => onSelect(option)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchValue ? "Aucun résultat trouvé" : "Chargement..."}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {renderDropdown(
        paysRef,
        isPaysOpen,
        setIsPaysOpen,
        paysSearch,
        setPaysSearch,
        value.pays,
        "Sélectionnez un pays",
        filteredCountries,
        handlePaysSelect,
        "Pays"
      )}

      {renderDropdown(
        regionRef,
        isRegionOpen,
        setIsRegionOpen,
        regionSearch,
        setRegionSearch,
        value.region,
        "Sélectionnez un département",
        filteredRegions,
        handleRegionSelect,
        "Département / Région",
        !value.pays
      )}

      {renderDropdown(
        villeRef,
        isVilleOpen,
        setIsVilleOpen,
        villeSearch,
        setVilleSearch,
        value.ville,
        "Sélectionnez une ville",
        filteredCities,
        handleVilleSelect,
        "Ville / Commune",
        !value.region
      )}

      {renderDropdown(
        sectionRef,
        isSectionOpen,
        setIsSectionOpen,
        sectionSearch,
        setSectionSearch,
        value.section,
        "Sélectionnez une section",
        filteredSections,
        handleSectionSelect,
        "Section Communale",
        !value.ville
      )}

      {required && (
        <>
          <input type="hidden" value={value.pays} required />
          <input type="hidden" value={value.region} required />
          <input type="hidden" value={value.ville} required />
          <input type="hidden" value={value.section} required />
        </>
      )}
    </div>
  );
};

export default LocationSelect;
