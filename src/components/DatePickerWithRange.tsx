import * as React from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { format, subDays, subYears } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMapContext } from "@/contexts/MapContext";

const presets = [
  {
    label: "T7",
    days: 7,
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      const sixDaysAgo = subDays(yesterday, 6);
      return {
        from: sixDaysAgo,
        to: yesterday,
      };
    },
  },
  {
    label: "T30",
    days: 30,
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      const thirtyDaysAgo = subDays(yesterday, 30);
      return {
        from: thirtyDaysAgo,
        to: yesterday,
      };
    },
  },
  {
    label: "T90",
    days: 90,
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      const ninetyDaysAgo = subDays(yesterday, 90);
      return {
        from: ninetyDaysAgo,
        to: yesterday,
      };
    },
  },
  {
    label: "1Y",
    days: 365,
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      const oneYearAgo = subYears(yesterday, 1);
      return {
        from: oneYearAgo,
        to: yesterday,
      };
    },
  },
  {
    label: "YTD",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      const startOfYear = new Date(yesterday.getFullYear(), 0, 1); // January 1st of current year
      return {
        from: startOfYear,
        to: yesterday,
      };
    },
  },
];

const isDateRangeMatchingPreset = (
  currentFrom: Date,
  currentTo: Date,
  preset: (typeof presets)[number]
) => {
  const presetRange = preset.getRange();
  return (
    format(currentFrom, "yyyy-MM-dd") ===
      format(presetRange.from, "yyyy-MM-dd") &&
    format(currentTo, "yyyy-MM-dd") === format(presetRange.to, "yyyy-MM-dd")
  );
};

export default function DatePickerWithRange() {
  const { dateRange, setDateRange } = useMapContext();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(dateRange.start),
    to: new Date(dateRange.end),
  });
  const [open, setOpen] = React.useState(false);

  const handlePresetClick = (preset: (typeof presets)[number]) => {
    const newRange = preset.getRange();
    setDate(newRange);
    setDateRange({
      start: format(newRange.from, "yyyy-MM-dd"),
      end: format(newRange.to, "yyyy-MM-dd"),
    });
    setOpen(false);
  };

  return (
    <div className="grid gap-2" data-testid="date-range-picker">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-0.5 -ml-1.5 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="flex gap-2 mb-4">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  date?.from &&
                  date?.to &&
                  isDateRangeMatchingPreset(date.from, date.to, preset)
                    ? "default"
                    : "outline"
                }
                className={cn(
                  "text-xs",
                  date?.from &&
                    date?.to &&
                    isDateRangeMatchingPreset(date.from, date.to, preset) &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              if (newDate?.from && newDate?.to) {
                setDateRange({
                  start: format(newDate.from, "yyyy-MM-dd"),
                  end: format(newDate.to, "yyyy-MM-dd"),
                });
                setOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
