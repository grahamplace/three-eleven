import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useMapContext } from "@/contexts/MapContext";

export type MapLayers = {
  points: boolean;
  heatmap: boolean;
  hexagons: boolean;
};

interface LayerToggleProps {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
}

export function LayerToggle() {
  const { visibleLayers, setVisibleLayers } = useMapContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle layers"
      >
        <Square3Stack3DIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg p-2 z-50">
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.points}
                onChange={(e) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    points: e.target.checked,
                  })
                }
                className="rounded border-gray-300 dark:border-gray-700"
              />
              <span>Points</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.heatmap}
                onChange={(e) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    heatmap: e.target.checked,
                  })
                }
                className="rounded border-gray-300 dark:border-gray-700"
              />
              <span>Heatmap</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibleLayers.hexagons}
                onChange={(e) =>
                  setVisibleLayers({
                    ...visibleLayers,
                    hexagons: e.target.checked,
                  })
                }
                className="rounded border-gray-300 dark:border-gray-700"
              />
              <span>Hexagons</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
