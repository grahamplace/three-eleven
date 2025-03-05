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
