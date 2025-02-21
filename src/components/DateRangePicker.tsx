import { CalendarIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useMapContext } from "@/contexts/MapContext";

export function DateRangePicker() {
  const { dateRange, setDateRange } = useMapContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "start" | "end"
  ) => {
    setDateRange({
      ...dateRange,
      [field]: e.target.value,
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Select date range"
      >
        <CalendarIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange(e, "start")}
                className="w-full rounded-md border border-border p-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange(e, "end")}
                className="w-full rounded-md border border-border p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
