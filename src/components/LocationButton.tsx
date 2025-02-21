"use client";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useMap } from "react-map-gl";
import { useState } from "react";
import { toast } from "sonner";

export function LocationButton() {
  const { map } = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Check if position is within San Francisco bounds
        const SF_BOUNDS = {
          north: 37.811749,
          south: 37.708075,
          east: -122.346582,
          west: -122.513272,
        };

        const { latitude, longitude } = position.coords;

        if (
          latitude > SF_BOUNDS.south &&
          latitude < SF_BOUNDS.north &&
          longitude > SF_BOUNDS.west &&
          longitude < SF_BOUNDS.east
        ) {
          map?.flyTo({
            center: [longitude, latitude],
            zoom: 16.5,
            duration: 1000,
          });
        } else {
          map?.flyTo({
            center: [-122.44, 37.77], // Default SF center
            zoom: 11.5,
            duration: 1000,
          });
          toast.warning(
            "Location outside San Francisco. Showing city center instead."
          );
        }
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access to use this feature.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        toast.error(errorMessage);
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <button
      onClick={handleGetLocation}
      disabled={isLocating}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Center map on my location"
    >
      <MapPinIcon className={`h-5 w-5 ${isLocating ? "animate-pulse" : ""}`} />
    </button>
  );
}
