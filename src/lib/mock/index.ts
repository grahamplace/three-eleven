type HeatmapPoint = {
  latitude: number;
  longitude: number;
  weight: number;
};

function generateSFMockPoints(numberOfPoints: number): HeatmapPoint[] {
  // SF boundaries (approximate)
  const SF_BOUNDS = {
    north: 37.811749,
    south: 37.708075,
    east: -122.346582,
    west: -122.513272,
  };

  // Popular neighborhoods to cluster around
  const HOTSPOTS = [
    { lat: 37.789, lng: -122.401, name: "Financial District" },
    { lat: 37.774, lng: -122.419, name: "Hayes Valley" },
    { lat: 37.761, lng: -122.435, name: "Mission District" },
    { lat: 37.779, lng: -122.433, name: "Lower Haight" },
    { lat: 37.799, lng: -122.407, name: "North Beach" },
    { lat: 37.786, lng: -122.44, name: "Japantown" },
  ];

  return Array.from({ length: numberOfPoints }, () => {
    // 70% chance to cluster around hotspots, 30% chance for random position
    const useHotspot = Math.random() < 0.7;

    let latitude: number;
    let longitude: number;

    if (useHotspot) {
      // Pick a random hotspot
      const hotspot = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      // Generate point within 0.5km of hotspot
      const radius = 0.005 * Math.sqrt(Math.random());
      const angle = Math.random() * 2 * Math.PI;
      latitude = hotspot.lat + radius * Math.cos(angle);
      longitude = hotspot.lng + radius * Math.sin(angle);
    } else {
      // Generate completely random point within SF bounds
      latitude =
        SF_BOUNDS.south + Math.random() * (SF_BOUNDS.north - SF_BOUNDS.south);
      longitude =
        SF_BOUNDS.west + Math.random() * (SF_BOUNDS.east - SF_BOUNDS.west);
    }

    // Generate a random weight between 1 and 10
    const weight = Math.floor(Math.random() * 10) + 1;

    return {
      latitude,
      longitude,
      weight,
    };
  });
}

export const mockCoordinates = generateSFMockPoints(1000);
