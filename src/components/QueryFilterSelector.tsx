"use client";

import { useEffect, useState } from "react";
import { useMapContext } from "@/contexts/MapContext";
import { getPredefinedQueries } from "@/lib/actions/service-requests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QueryOption = {
  id: string;
  name: string;
  description: string;
};

export function QueryFilterSelector() {
  const [queries, setQueries] = useState<QueryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedQuery, setSelectedQuery } = useMapContext();

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const data = await getPredefinedQueries();
        console.log("Fetched queries:", data);
        // Add an "All" option at the beginning
        setQueries([
          { id: "all", name: "All", description: "Show all service requests" },
          ...data,
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching predefined queries:", error);
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  // Convert null to "all" for the Select component
  const value = selectedQuery || "all";

  const handleValueChange = (newValue: string) => {
    // Convert "all" back to null for the context
    setSelectedQuery(newValue === "all" ? null : newValue);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={loading}>
      <SelectTrigger className="w-full md:w-[200px]">
        <SelectValue placeholder="Select a filter" />
      </SelectTrigger>
      <SelectContent>
        {queries.map((query) => (
          <SelectItem key={query.id} value={query.id}>
            {query.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
