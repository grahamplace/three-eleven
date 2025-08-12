import { http, HttpResponse } from "msw";

// Mock SF 311 API responses
export const handlers = [
  // Mock SF 311 SODA API
  http.get("https://data.sfgov.org/resource/vw6y-z8j6.json", ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get("$limit") || "1000";
    const offset = url.searchParams.get("$offset") || "0";

    // Return mock service request data
    const mockData = Array.from({ length: parseInt(limit) }, (_, i) => ({
      service_request_id: `test-${parseInt(offset) + i}`,
      requested_datetime: "2024-01-15T10:30:00.000",
      closed_date: null,
      updated_datetime: "2024-01-15T10:30:00.000",
      status_description: "Open",
      status_notes: "Test request",
      agency_responsible: "DPW",
      service_name: "Graffiti",
      service_subtype: "Public Property",
      service_details: "Test graffiti",
      address: "123 Test St",
      street: "Test St",
      supervisor_district: "6",
      neighborhoods_sffind_boundaries: "Test Neighborhood",
      analysis_neighborhood: "Test District",
      police_district: "Central",
      source: "Test",
      data_as_of: "2024-01-15T10:30:00.000",
      data_loaded_at: "2024-01-15T10:30:00.000",
      lat: "37.7749",
      long: "-122.4194",
      media_url: null,
    }));

    return HttpResponse.json(mockData);
  }),

  // Mock any other external APIs as needed
  http.get("*", () => {
    return HttpResponse.json({ error: "Unhandled request" }, { status: 404 });
  }),
];
