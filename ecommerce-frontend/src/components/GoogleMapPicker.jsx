import { useState, useEffect, useRef } from "react";
import { MapPin, X, Check, Locate, Search, Navigation, ChevronUp } from "lucide-react";

// Google Maps API Key - Uses environment variable if available, otherwise uses the provided key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAUAOXsyEBFtdt4LHZ2Cbv12lyTwMLdO-c";

const GoogleMapPicker = ({ onSelectLocation, initialLocation, address }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { lat: 11.5564, lng: 104.9282 } // Default to Phnom Penh, Cambodia
  );
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addressName, setAddressName] = useState("");
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(true);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // On iOS, also handle touch events
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isOpen]);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );

    if (existingScript) {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
      } else {
        const handleLoad = () => {
          setIsGoogleMapsLoaded(true);
          setLocationError("");
        };
        existingScript.addEventListener("load", handleLoad);
        return () => existingScript.removeEventListener("load", handleLoad);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.id = "google-maps-script";

    script.onload = () => {
      setIsGoogleMapsLoaded(true);
      setLocationError("");
    };

    script.onerror = () => {
      setLocationError("Failed to load Google Maps. Please check your API key and try again.");
      setIsGoogleMapsLoaded(false);
    };

    document.head.appendChild(script);

    return () => { };
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    if (!isGoogleMapsLoaded || !window.google || !window.google.maps) {
      setIsMapLoading(true);
      setLocationError("Loading Google Maps...");
      return;
    }

    if (mapInstanceRef.current) {
      setIsMapLoading(false);
      setLocationError("");
      return;
    }

    try {
      setIsMapLoading(true);

      // Detect if mobile
      const isMobile = window.innerWidth < 768;

      const map = new window.google.maps.Map(mapRef.current, {
        center: selectedLocation,
        zoom: 15,
        // Simplified controls on mobile
        mapTypeControl: !isMobile,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false, // Hide on mobile for cleaner UI
        fullscreenControl: false, // We already have full screen modal
        zoomControl: !isMobile, // Hide zoom buttons on mobile (pinch to zoom)
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        gestureHandling: "greedy", // Allow single-finger map panning on mobile
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Create custom marker - slightly larger on mobile for visibility
      const marker = new window.google.maps.Marker({
        position: selectedLocation,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isMobile ? 14 : 12,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      markerRef.current = marker;

      const updateAddress = (latLng) => {
        try {
          if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
            return;
          }
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results[0]) {
              setAddressName(results[0].formatted_address);
            } else if (status === "REQUEST_DENIED") {
              console.warn("Geocoding API not enabled.");
            }
          });
        } catch (error) {
          console.warn("Geocoding failed:", error);
        }
      };

      // Handle map clicks
      map.addListener("click", (e) => {
        const newLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        setSelectedLocation(newLocation);
        marker.setPosition(e.latLng);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 750);
        updateAddress(e.latLng);
        setShowBottomSheet(true);
      });

      // Handle marker drag
      marker.addListener("dragend", (e) => {
        const newLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        setSelectedLocation(newLocation);
        map.panTo(e.latLng);
        updateAddress(e.latLng);
        setShowBottomSheet(true);
      });

      // Initialize autocomplete for search
      if (searchInputRef.current && window.google.maps.places) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              fields: ["geometry", "formatted_address", "name"],
            }
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const newLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
              setSelectedLocation(newLocation);
              map.setCenter(newLocation);
              map.setZoom(17);
              marker.setPosition(newLocation);
              marker.setAnimation(window.google.maps.Animation.BOUNCE);
              setTimeout(() => marker.setAnimation(null), 750);
              setAddressName(place.formatted_address || place.name);
              setIsSearchFocused(false);
              // Blur search input on mobile after selection
              if (searchInputRef.current) {
                searchInputRef.current.blur();
              }
            }
          });

          autocompleteRef.current = autocomplete;
        } catch (e) {
          console.warn("Places Autocomplete failed to initialize");
        }
      }

      // Geocode initial address if provided
      if (address && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK" && results[0]) {
              const location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              };
              setSelectedLocation(location);
              map.setCenter(location);
              marker.setPosition(results[0].geometry.location);
              setAddressName(results[0].formatted_address);
            }
          });
        } catch (e) {
          console.warn("Initial address geocoding failed");
        }
      } else {
        updateAddress(selectedLocation);
      }

      setIsMapLoading(false);
      setLocationError("");
    } catch (error) {
      console.error("Error initializing map:", error);
      setLocationError("Failed to initialize map. Please try again.");
      setIsMapLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
    };
  }, [isOpen, address, isGoogleMapsLoaded]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(location);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(17);
        }

        if (markerRef.current) {
          markerRef.current.setPosition(location);
          markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => markerRef.current.setAnimation(null), 750);
        }

        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
              if (status === "OK" && results[0]) {
                setAddressName(results[0].formatted_address);
              }
            });
          } catch (e) {
            console.warn("Geocoding failed during location detection");
          }
        }

        setDetectingLocation(false);
        setShowBottomSheet(true);
      },
      (error) => {
        setDetectingLocation(false);
        let errorMessage = "Could not detect location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable it in settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Request timed out. Please try again.";
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirmLocation = () => {
    onSelectLocation(selectedLocation);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (mapInstanceRef.current) {
      window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  };

  return (
    <>
      {/* Button to open map picker */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-200 font-semibold shadow-sm hover:shadow-md active:scale-95"
      >
        <MapPin className="w-4 h-4" />
        {initialLocation ? "Update Location on Map" : "Select Location on Map"}
      </button>

      {/* Full Screen Modal - Mobile First */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-white md:bg-black/60 md:backdrop-blur-md md:items-center md:justify-center md:p-4"
          style={{ touchAction: "none" }}
        >
          {/* Desktop wrapper */}
          <div className="flex flex-col w-full h-full md:bg-white md:rounded-3xl md:shadow-2xl md:max-w-5xl md:max-h-[95vh] md:overflow-hidden">

            {/* === HEADER === */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-white shrink-0 safe-area-top">
              {/* Close button - left on mobile for thumb reach */}
              <button
                onClick={handleClose}
                className="p-2.5 -ml-1 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-90 md:order-2 md:ml-4 md:-mr-1"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </button>
              <div className="flex-1 text-center md:text-left md:order-1">
                <h2 className="text-base md:text-xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                  <div className="p-1.5 md:p-2 bg-blue-600 rounded-lg md:rounded-xl">
                    <MapPin className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                  </div>
                  <span>Select Location</span>
                </h2>
              </div>
              {/* Spacer for mobile centering */}
              <div className="w-10 md:hidden"></div>
            </div>

            {/* === MAP CONTAINER - Takes full remaining space === */}
            <div className="flex-1 relative bg-gray-100 min-h-0">
              {/* Map */}
              <div
                ref={mapRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0 }}
              ></div>

              {/* Loading Overlay */}
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100" style={{ zIndex: 5 }}>
                  <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-700 font-semibold text-sm md:text-lg">Loading Map...</p>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">Please wait a moment</p>
                  </div>
                </div>
              )}

              {/* === SEARCH BAR - Floating on map === */}
              <div
                className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4"
                style={{ zIndex: 20 }}
              >
                <div className="relative max-w-lg mx-auto md:mx-0 md:max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search location..."
                    className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-3.5 rounded-2xl border-0 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm md:text-base font-medium"
                    style={{
                      boxShadow: isSearchFocused
                        ? "0 8px 30px rgba(59, 130, 246, 0.15), 0 4px 10px rgba(0,0,0,0.08)"
                        : "0 4px 15px rgba(0,0,0,0.1)",
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </div>
              </div>

              {/* === FLOATING ACTION BUTTONS - Right side === */}
              <div
                className="absolute right-3 md:right-4 flex flex-col items-end gap-2.5"
                style={{
                  zIndex: 15,
                  bottom: showBottomSheet && addressName ? "200px" : "140px",
                  transition: "bottom 0.3s ease",
                }}
              >
                {/* Error Message */}
                {locationError && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 shadow-lg max-w-[200px] text-center animate-pulse">
                    {locationError}
                  </div>
                )}

                {/* My Location FAB */}
                <button
                  type="button"
                  onClick={detectUserLocation}
                  disabled={detectingLocation}
                  className="w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-3 bg-white rounded-full md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 disabled:opacity-50 flex items-center justify-center md:gap-2.5 font-semibold text-gray-900 active:scale-90 group"
                  title="Use my current location"
                >
                  {detectingLocation ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="hidden md:inline text-sm">My Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* === BOTTOM SHEET - Mobile-friendly info + confirm === */}
              <div
                className="absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out"
                style={{
                  zIndex: 20,
                  transform: showBottomSheet ? "translateY(0)" : "translateY(calc(100% - 60px))",
                }}
              >
                {/* Pull indicator on mobile */}
                <div
                  className="flex justify-center py-2 md:hidden cursor-pointer"
                  onClick={() => setShowBottomSheet(!showBottomSheet)}
                >
                  <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                <div className="bg-white rounded-t-3xl md:rounded-none shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 pb-4 pt-2 md:px-6 md:py-4 safe-area-bottom">
                  {/* Selected Address Info */}
                  {addressName && (
                    <div className="mb-3 md:mb-4">
                      <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-3 md:p-4">
                        <div className="p-2 bg-blue-600 rounded-xl shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                            Delivery Location
                          </p>
                          <p className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed">
                            {addressName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coordinates */}
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                      <p className="text-[10px] md:text-xs font-mono text-gray-500">
                        📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-400 hidden md:block">
                      Tap the map or drag the marker
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 md:flex-none px-5 py-3.5 md:py-3 bg-gray-100 text-gray-700 rounded-2xl md:rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold text-sm active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLocation}
                      className="flex-[2] md:flex-none px-6 py-3.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl md:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl text-sm active:scale-95"
                    >
                      <Check className="w-4 h-4 md:w-5 md:h-5" />
                      Confirm Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === CUSTOM STYLES === */}
      <style>{`
        /* Safe area for notched phones */
        .safe-area-top {
          padding-top: max(0.75rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        /* Override Google Maps autocomplete dropdown for mobile */
        .pac-container {
          z-index: 99999 !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
          margin-top: 8px !important;
          font-family: inherit !important;
          overflow: hidden !important;
        }

        @media (max-width: 767px) {
          .pac-container {
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            border-radius: 16px !important;
          }
        }

        .pac-item {
          padding: 12px 16px !important;
          border: none !important;
          border-bottom: 1px solid #f3f4f6 !important;
          cursor: pointer !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          display: flex !important;
          align-items: center !important;
          min-height: 48px !important; /* Touch target */
        }

        .pac-item:last-child {
          border-bottom: none !important;
        }

        .pac-item:hover,
        .pac-item:active {
          background-color: #eff6ff !important;
        }

        .pac-item-query {
          font-weight: 600 !important;
          font-size: 14px !important;
          color: #1f2937 !important;
        }

        .pac-icon {
          margin-right: 12px !important;
          width: 20px !important;
          height: 20px !important;
        }

        .pac-matched {
          font-weight: 700 !important;
          color: #2563eb !important;
        }

        /* Hide Google logo in autocomplete */
        .pac-logo::after {
          display: none !important;
        }

        /* Smooth animations */
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default GoogleMapPicker;
