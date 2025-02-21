import { MapIcon } from "@heroicons/react/24/outline";
import { useMap } from "react-map-gl";

export function RecenterButton() {
  const { map } = useMap();

  const handleRecenter = () => {
    map?.flyTo({
      center: [-122.44, 37.77],
      zoom: 11.5,
      duration: 1000,
    });
  };

  return (
    <button
      onClick={handleRecenter}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Recenter map"
    >
      <MapIcon className="h-5 w-5" />
    </button>
  );
}
