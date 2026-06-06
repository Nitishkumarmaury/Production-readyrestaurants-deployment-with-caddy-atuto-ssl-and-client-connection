import React from "react";
import usePlacesAutocomplete from "use-places-autocomplete";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";

const libraries: Libraries = ["places"];

interface GoogleAddressInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string) => void;
  className?: string;
  inputClassName?: string;
}

export const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  label,
  placeholder = "Enter address...",
  value,
  onChange,
  onAddressSelect,
  className = "",
  inputClassName = "",
}) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY || "",
    libraries,
  });

  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data: suggestions },
    setValue: setAutocompleteValue,
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    debounce: 300,
    initOnMount: false,
    defaultValue: value,
  });

  React.useEffect(() => {
    if (isLoaded) {
      init();
    }
  }, [isLoaded, init]);

  React.useEffect(() => {
  }, [isLoaded, ready]);

  React.useEffect(() => {
    if (status !== "OK" && status !== "ZERO_RESULTS" && autocompleteValue.length > 2) {
    }
  }, [status, autocompleteValue]);

  // Sync internal autocomplete value with external value prop
  React.useEffect(() => {
    if (value !== autocompleteValue) {
      setAutocompleteValue(value, false);
    }
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutocompleteValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSelect = (description: string) => {
    setAutocompleteValue(description, false);
    clearSuggestions();
    onChange(description);
    if (onAddressSelect) {
      onAddressSelect(description);
    }
  };

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      {label && <label className="text-sm font-medium text-white/90">{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        value={autocompleteValue}
        onChange={handleInput}
        disabled={!ready}
        className={`h-[50px] rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 disabled:opacity-50 ${inputClassName}`}
      />
      {/* Suggestions list */}
      {status === "OK" && (
        <ul className="absolute top-[calc(100%+2px)] left-0 right-0 z-50 m-0 max-h-[220px] list-none overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1b] p-1 shadow-2xl">
          {suggestions.map(({ place_id, description }) => (
            <li key={place_id}>
              <button
                type="button"
                className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-white/70 transition hover:bg-white/5"
                onClick={() => handleSelect(description)}
              >
                {description}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error status indicator */}
      {status !== "" && status !== "OK" && status !== "ZERO_RESULTS" && (
        <div className="absolute top-[calc(100%+2px)] left-0 right-0 z-50 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400 backdrop-blur-sm">
          Google Maps Error: {status}. Please check your API key and Places API permissions.
        </div>
      )}
    </div>
  );
};
