export type QueryDefinition = {
  id: string;
  name: string;
  description: string;
  rules: QueryRule[];
};

export type QueryRule = {
  field:
    | "service_details"
    | "service_name"
    | "service_subtype"
    | "status_description"
    | "agency_responsible";
  operator: "equals" | "contains" | "in";
  value: string | string[];
};

// After adding a new query, manually trigger the backfill function to add the query tags to the database
// Otherwise, the query will not apply until the first of the month
export const PREDEFINED_QUERIES: Record<string, QueryDefinition> = {
  poop: {
    id: "poop",
    name: "Human/Animal Waste",
    description: "Service requests related to human or animal waste",
    rules: [
      {
        field: "service_details",
        operator: "in",
        value: [
          "Human or Animal Waste",
          "human_waste_or_urine",
          "Human/Animal Waste - ClearChannel",
          "Human/Animal Waste",
          "Human / Animal Waste",
          "Human/Animal Waste - CalTrans",
          "Human/Animal Waste - BART",
          "Human/Animal Waste - Other",
        ],
      },
    ],
  },
  noise: {
    id: "noise",
    name: "Noise Reports",
    description: "Service requests related to noise complaints",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Noise Report", "Noise"],
      },
    ],
  },
  graffiti: {
    id: "graffiti",
    name: "Graffiti",
    description: "Service requests related to graffiti",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Graffiti", "Graffiti Public", "Graffiti Private"],
      },
    ],
  },
  encampments: {
    id: "encampments",
    name: "Encampments",
    description: "Service requests related to encampments",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Encampments", "Encampment"],
      },
    ],
  },
  parking_enforcement: {
    id: "parking_enforcement",
    name: "Parking Enforcement",
    description: "Service requests related to parking enforcement",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Parking Enforcement"],
      },
    ],
  },
  street_and_sidewalk_cleaning: {
    id: "street_and_sidewalk_cleaning",
    name: "Street and Sidewalk Cleaning",
    description: "Service requests related to street and sidewalk cleaning",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Street and Sidewalk Cleaning"],
      },
    ],
  },
  abandoned_vehicles: {
    id: "abandoned_vehicles",
    name: "Abandoned Vehicles",
    description: "Service requests related to abandoned vehicles",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Abandoned Vehicle"],
      },
    ],
  },
  tree_maintenance: {
    id: "tree_maintenance",
    name: "Tree Maintenance",
    description: "Service requests related to tree maintenance",
    rules: [
      {
        field: "service_name",
        operator: "in",
        value: ["Tree Maintenance"],
      },
    ],
  },
};

export function evaluateServiceRequestAgainstQuery(
  serviceRequest: any,
  queryDefinition: QueryDefinition
): boolean {
  // A service request matches if it satisfies ANY of the rules
  return queryDefinition.rules.some((rule) => {
    const fieldValue = serviceRequest[rule.field];

    // Skip if field value is null
    if (fieldValue === null) return false;

    switch (rule.operator) {
      case "equals":
        return fieldValue === rule.value;
      case "contains":
        return (
          typeof fieldValue === "string" &&
          typeof rule.value === "string" &&
          fieldValue.toLowerCase().includes(rule.value.toLowerCase())
        );
      case "in":
        if (Array.isArray(rule.value)) {
          return rule.value.includes(fieldValue);
        }
        return false;
      default:
        return false;
    }
  });
}

export function getMatchingQueryIds(serviceRequest: any): string[] {
  return Object.values(PREDEFINED_QUERIES)
    .filter((query) =>
      evaluateServiceRequestAgainstQuery(serviceRequest, query)
    )
    .map((query) => query.id);
}
