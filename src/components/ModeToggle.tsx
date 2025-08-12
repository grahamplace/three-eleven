import React from "react";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useMapContext, MapMode } from "@/contexts/MapContext";

export function ModeToggle() {
  const { mode, setMode } = useMapContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const modes: { value: MapMode; label: string }[] = [
    { value: "heatmap", label: "Heatmap" },
    { value: "points", label: "Points" },
    { value: "hexabin", label: "Hexabin" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative"
      ref={containerRef}
      data-testid="mode-toggle-buttons"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg md:hover:bg-gray-100 dark:md:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
        aria-label="Toggle map mode"
      >
        <Square3Stack3DIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg p-2 z-50">
          <div className="space-y-2">
            {modes.map((m) => (
              <label
                key={m.value}
                className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer md:hover:bg-gray-100 dark:md:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  checked={mode === m.value}
                  onChange={() => {
                    setMode(m.value);
                    setIsOpen(false);
                  }}
                  className="rounded border-gray-300 dark:border-gray-700"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
