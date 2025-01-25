import { createMany } from "@/store/service-request";

async function run() {
  console.info("Running seed-db script");
  await testServiceRequestUpsert();
  process.exit(0);
}

async function testServiceRequestUpsert() {
  console.info("Running testServiceRequestUpsert");
  const exampleRequests = [
    {
      service_request_id: "3827464",
      requested_datetime: new Date("2024-03-15T10:30:00Z"),
      closed_date: null,
      updated_datetime: new Date("2024-03-15T10:30:00Z"),
      status_description: "Open",
      status_notes: "Initial report of graffiti",
      agency_responsible: "DPW",
      service_name: "Graffiti",
      service_subtype: "Public Property",
      service_details: "Large graffiti on public wall",
      address: "123 Main St",
      street: "Main St",
      supervisor_district: 6,
      neighborhoods_sffind_boundaries: "Downtown",
      analysis_neighborhood: "Financial District",
      police_district: "Central",
      source: "Mobile App",
      data_as_of: new Date("2024-03-15T10:30:00Z"),
      data_loaded_at: new Date("2024-03-15T10:30:00Z"),
      lat: 37.7749,
      long: -122.4194,
      media_url: "https://example.com/image1.jpg",
    },
    {
      service_request_id: "3827478",
      requested_datetime: new Date("2024-03-15T11:00:00Z"),
      closed_date: new Date("2024-03-15T14:00:00Z"),
      updated_datetime: new Date("2024-03-15T14:00:00Z"),
      status_description: "Closed",
      status_notes: "Pothole filled",
      agency_responsible: "DPW",
      service_name: "Street and Sidewalk",
      service_subtype: "Pothole",
      service_details: "Deep pothole needs immediate attention",
      address: "456 Market St",
      street: "Market St",
      supervisor_district: 3,
      neighborhoods_sffind_boundaries: "Financial District",
      analysis_neighborhood: "Financial District",
      police_district: "Southern",
      source: "Web",
      data_as_of: new Date("2024-03-15T14:00:00Z"),
      data_loaded_at: new Date("2024-03-15T14:00:00Z"),
      lat: 37.7897,
      long: -122.3981,
      media_url: null,
    },
  ];

  try {
    const result = await createMany(exampleRequests);
    console.info(`Successfully upserted ${result.length} service requests`);
  } catch (error) {
    console.error("Error upserting service requests:", error);
  }
}

run().catch((error) => {
  console.error("Error running seed script:", error);
  process.exit(1);
});
