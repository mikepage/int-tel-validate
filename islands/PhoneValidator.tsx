import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

type NumberType = "mobile" | "fixed_line" | "any";

interface ValidationResult {
  isValid: boolean;
  number: string;
  countryCode: string;
  countryName: string;
  nationalNumber: string;
  internationalNumber: string;
  numberType: string;
  errorMessage?: string;
}

const numberTypeLabels: Record<string, string> = {
  FIXED_LINE: "Fixed Line",
  MOBILE: "Mobile",
  FIXED_LINE_OR_MOBILE: "Fixed Line or Mobile",
  TOLL_FREE: "Toll Free",
  PREMIUM_RATE: "Premium Rate",
  SHARED_COST: "Shared Cost",
  VOIP: "VoIP",
  PERSONAL_NUMBER: "Personal Number",
  PAGER: "Pager",
  UAN: "UAN",
  VOICEMAIL: "Voicemail",
  UNKNOWN: "Unknown",
};

const errorMessages: Record<number, string> = {
  0: "Invalid number",
  1: "Invalid country code",
  2: "Number too short",
  3: "Number too long",
  4: "Invalid length",
};

export default function PhoneValidator() {
  const inputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  const strictMode = useSignal(false);
  const numberTypeFilter = useSignal<NumberType>("any");
  const result = useSignal<ValidationResult | null>(null);
  const isLoading = useSignal(true);

  useEffect(() => {
    if (!inputRef.current) return;

    const iti = intlTelInput(inputRef.current, {
      initialCountry: "auto",
      geoIpLookup: (callback) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => callback(data.country_code))
          .catch(() => callback("us"));
      },
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.0/build/js/utils.js",
      nationalMode: false,
      formatAsYouType: true,
      formatOnDisplay: true,
      strictMode: strictMode.value,
    });

    itiRef.current = iti;
    isLoading.value = false;

    return () => {
      iti.destroy();
    };
  }, []);

  useEffect(() => {
    if (itiRef.current && inputRef.current) {
      itiRef.current.destroy();
      itiRef.current = intlTelInput(inputRef.current, {
        initialCountry: "auto",
        geoIpLookup: (callback) => {
          fetch("https://ipapi.co/json")
            .then((res) => res.json())
            .then((data) => callback(data.country_code))
            .catch(() => callback("us"));
        },
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.0/build/js/utils.js",
        nationalMode: false,
        formatAsYouType: true,
        formatOnDisplay: true,
        strictMode: strictMode.value,
      });
    }
  }, [strictMode.value]);

  const handleValidate = () => {
    if (!itiRef.current || !inputRef.current) return;

    const iti = itiRef.current;
    const isValid = iti.isValidNumber();
    const numberData = iti.getSelectedCountryData();

    if (!isValid) {
      const errorCode = iti.getValidationError();
      result.value = {
        isValid: false,
        number: inputRef.current.value,
        countryCode: numberData.iso2?.toUpperCase() || "",
        countryName: numberData.name || "",
        nationalNumber: "",
        internationalNumber: "",
        numberType: "",
        errorMessage: errorMessages[errorCode] || "Invalid number",
      };
      return;
    }

    const numberType = iti.getNumberType();
    const numberTypeKey = Object.keys(window.intlTelInputUtils?.numberType || {}).find(
      (key) => (window.intlTelInputUtils?.numberType as Record<string, number>)?.[key] === numberType
    ) || "UNKNOWN";

    // Check type filter
    if (numberTypeFilter.value !== "any") {
      const isMobile = numberTypeKey === "MOBILE" || numberTypeKey === "FIXED_LINE_OR_MOBILE";
      const isFixedLine = numberTypeKey === "FIXED_LINE" || numberTypeKey === "FIXED_LINE_OR_MOBILE";

      if (numberTypeFilter.value === "mobile" && !isMobile) {
        result.value = {
          isValid: false,
          number: inputRef.current.value,
          countryCode: numberData.iso2?.toUpperCase() || "",
          countryName: numberData.name || "",
          nationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.NATIONAL) || "",
          internationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.INTERNATIONAL) || "",
          numberType: numberTypeLabels[numberTypeKey] || numberTypeKey,
          errorMessage: `Expected mobile number, got ${numberTypeLabels[numberTypeKey] || numberTypeKey}`,
        };
        return;
      }

      if (numberTypeFilter.value === "fixed_line" && !isFixedLine) {
        result.value = {
          isValid: false,
          number: inputRef.current.value,
          countryCode: numberData.iso2?.toUpperCase() || "",
          countryName: numberData.name || "",
          nationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.NATIONAL) || "",
          internationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.INTERNATIONAL) || "",
          numberType: numberTypeLabels[numberTypeKey] || numberTypeKey,
          errorMessage: `Expected fixed line number, got ${numberTypeLabels[numberTypeKey] || numberTypeKey}`,
        };
        return;
      }
    }

    result.value = {
      isValid: true,
      number: inputRef.current.value,
      countryCode: numberData.iso2?.toUpperCase() || "",
      countryName: numberData.name || "",
      nationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.NATIONAL) || "",
      internationalNumber: iti.getNumber(window.intlTelInputUtils?.numberFormat?.INTERNATIONAL) || "",
      numberType: numberTypeLabels[numberTypeKey] || numberTypeKey,
    };
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    result.value = null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div class="w-full max-w-2xl mx-auto">
      {/* Input Section */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <div class="relative">
          <input
            ref={inputRef}
            type="tel"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            placeholder="Enter phone number..."
          />
        </div>
        {isLoading.value && (
          <p class="text-xs text-gray-500 mt-1">Loading...</p>
        )}
      </div>

      {/* Options Section */}
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Options</h3>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={strictMode.value}
              onChange={(e) => strictMode.value = (e.target as HTMLInputElement).checked}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">Strict Mode</span>
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">Number Type:</span>
            <select
              value={numberTypeFilter.value}
              onChange={(e) => numberTypeFilter.value = (e.target as HTMLSelectElement).value as NumberType}
              class="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="any">Any</option>
              <option value="mobile">Mobile</option>
              <option value="fixed_line">Fixed Line</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div class="flex gap-3 mb-6">
        <button
          onClick={handleValidate}
          class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Validate
        </button>
        <button
          onClick={handleClear}
          class="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Results Section */}
      {result.value && (
        <div class={`rounded-lg shadow p-4 ${result.value.isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div class="flex items-center gap-2 mb-3">
            <span class={`text-lg font-semibold ${result.value.isValid ? "text-green-700" : "text-red-700"}`}>
              {result.value.isValid ? "Valid" : "Invalid"}
            </span>
            {result.value.errorMessage && (
              <span class="text-sm text-red-600">- {result.value.errorMessage}</span>
            )}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="bg-white rounded p-3 border border-gray-200">
              <div class="text-gray-500 text-xs mb-1">Country</div>
              <div class="font-mono flex items-center justify-between">
                <span>{result.value.countryName} ({result.value.countryCode})</span>
              </div>
            </div>

            <div class="bg-white rounded p-3 border border-gray-200">
              <div class="text-gray-500 text-xs mb-1">Number Type</div>
              <div class="font-mono">{result.value.numberType || "—"}</div>
            </div>

            {result.value.nationalNumber && (
              <div class="bg-white rounded p-3 border border-gray-200">
                <div class="text-gray-500 text-xs mb-1">National Format</div>
                <div class="font-mono flex items-center justify-between">
                  <span>{result.value.nationalNumber}</span>
                  <button
                    onClick={() => copyToClipboard(result.value!.nationalNumber)}
                    class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Copy"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {result.value.internationalNumber && (
              <div class="bg-white rounded p-3 border border-gray-200">
                <div class="text-gray-500 text-xs mb-1">International Format</div>
                <div class="font-mono flex items-center justify-between">
                  <span>{result.value.internationalNumber}</span>
                  <button
                    onClick={() => copyToClipboard(result.value!.internationalNumber)}
                    class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Copy"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    intlTelInputUtils?: {
      numberFormat?: {
        E164: number;
        INTERNATIONAL: number;
        NATIONAL: number;
        RFC3966: number;
      };
      numberType?: Record<string, number>;
    };
  }
}
