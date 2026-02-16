import { useState, useEffect, useRef } from "react";
import { MapPin, X, Check, Locate, Search } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();


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

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load Google Maps Script
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setLocationError(
        "Google Maps is not configured. Set VITE_GOOGLE_MAPS_API_KEY in your .env file."
      );
      setIsGoogleMapsLoaded(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );

    if (existingScript) {
      // Script exists, wait for it to load
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
      } else {
        // Wait for existing script to load
        const handleLoad = () => {
          setIsGoogleMapsLoaded(true);
          setLocationError("");
        };
        existingScript.addEventListener('load', handleLoad);
        return () => existingScript.removeEventListener('load', handleLoad);
      }
      return;
    }

    // Create new script only if it doesn't exist
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.id = "google-maps-script"; // Add ID to identify the script

    script.onload = () => {
      setIsGoogleMapsLoaded(true);
      setLocationError("");
    };

    script.onerror = () => {
      setLocationError("Failed to load Google Maps. Please check your API key and try again.");
      setIsGoogleMapsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount as it may be needed by other components
    };
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Wait for Google Maps to be loaded
    if (!isGoogleMapsLoaded || !window.google || !window.google.maps) {
      setIsMapLoading(true);
      setLocationError("Loading Google Maps...");
      return;
    }

    // Don't reinitialize if map already exists
    if (mapInstanceRef.current) {
      setIsMapLoading(false);
      setLocationError("");
      return;
    }

    try {
      setIsMapLoading(true);

      // Create the map with professional styling
      const map = new window.google.maps.Map(mapRef.current, {
        center: selectedLocation,
        zoom: 15,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        // Professional Map Styling
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

      // Create custom marker with animation
      const marker = new window.google.maps.Marker({
        position: selectedLocation,
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      markerRef.current = marker;

      // Update address display when marker is placed (optional feature)
      const updateAddress = (latLng) => {
        try {
          if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
            return; // Geocoding not available
          }

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results[0]) {
              setAddressName(results[0].formatted_address);
            } else if (status === "REQUEST_DENIED") {
              console.warn("Geocoding API not enabled. Address names won't be shown.");
              // Still works, just won't show address names
            }
          });
        } catch (error) {
          console.warn("Geocoding failed:", error);
          // Non-critical error, map still works
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
            }
          });

          autocompleteRef.current = autocomplete;
        } catch (error) {
          console.warn("Places Autocomplete failed to initialize", error);
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
        } catch (error) {
          console.warn("Initial address geocoding failed", error);
        }
      } else {
        // Get initial address name
        const markerPosition = marker.getPosition();
        if (markerPosition) {
          updateAddress(markerPosition);
        }
      }

      // Mark map as loaded
      setIsMapLoading(false);
      setLocationError("");

    } catch (error) {
      console.error("Error initializing map:", error);
      setLocationError("Failed to initialize map. Please try again.");
      setIsMapLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
    };
  }, [isOpen, address, isGoogleMapsLoaded, selectedLocation]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      window.alert("Geolocation is not supported by your browser.");
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

        // Get address for detected location (optional)
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
              if (status === "OK" && results[0]) {
                setAddressName(results[0].formatted_address);
              }
            });
          } catch (error) {
            console.warn("Geocoding failed during location detection", error);
          }
        }

        setDetectingLocation(false);
      },
      (error) => {
        setDetectingLocation(false);
        let errorMessage = "Could not detect location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission denied. Please enable location access in your browser settings to use this feature.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Request timed out. Please try again.";
            break;
        }
        setLocationError(errorMessage);
        window.alert(errorMessage);
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
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-200 font-semibold shadow-sm hover:shadow-md"
      >
        <MapPin className="w-4 h-4" />
        {initialLocation ? "Update Location on Map" : "Select Location on Map"}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  Select Delivery Location
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Click on the map, drag the marker, or search for your location
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-300 ml-4"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location, address, or place..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-[500px] bg-gray-100">
              <div
                ref={mapRef}
                className="w-full h-full min-h-[500px]"
                style={{ zIndex: 0 }}
              ></div>

              {/* Loading Overlay */}
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100" style={{ zIndex: 5 }}>
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-700 font-semibold text-lg">Loading Google Maps...</p>
                    <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
                  </div>
                </div>
              )}

              {/* Controls Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none" style={{ zIndex: 10 }}>
                {/* Address Display */}
                {addressName && (
                  <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-gray-200 max-w-md pointer-events-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Selected Location
                    </p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2">
                      {addressName}
                    </p>
                  </div>
                )}
              </div>

              {/* Location Detection Button */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3" style={{ zIndex: 10 }}>
                {locationError && (
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 shadow-lg max-w-[250px] text-center animate-fade-in">
                    {locationError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={detectUserLocation}
                  disabled={detectingLocation}
                  className="bg-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-gray-900 hover:bg-blue-50 group"
                  title="Use my current location"
                >
                  {detectingLocation ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Locate className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Use My Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Coordinates Display */}
              <div className="absolute bottom-4 left-4" style={{ zIndex: 10 }}>
                <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-200">
                  <p className="text-xs font-mono text-gray-600">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Check className="w-5 h-5" />
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleMapPicker;
