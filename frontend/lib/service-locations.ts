export type ServiceLocationOption = {
  label: string;
  latitude: number;
  longitude: number;
};

/** Bulgarian cities used for list-service location autocomplete. */
export const SERVICE_LOCATIONS: ServiceLocationOption[] = [
  { label: "Sofia, Bulgaria", latitude: 42.6977, longitude: 23.3219 },
  { label: "Plovmotion, Bulgaria", latitude: 42.1354, longitude: 24.7453 },
  { label: "Varna, Bulgaria", latitude: 43.2141, longitude: 27.9147 },
  { label: "Burgas, Bulgaria", latitude: 42.5048, longitude: 27.4626 },
  { label: "Ruse, Bulgaria", latitude: 43.8356, longitude: 25.9657 },
  { label: "Stara Zagora, Bulgaria", latitude: 42.4258, longitude: 25.6345 },
  { label: "Pleven, Bulgaria", latitude: 43.417, longitude: 24.6067 },
  { label: "Sliven, Bulgaria", latitude: 42.6817, longitude: 26.3229 },
  { label: "Dobrich, Bulgaria", latitude: 43.5726, longitude: 27.8273 },
  { label: "Shumen, Bulgaria", latitude: 43.2712, longitude: 26.9361 },
  { label: "Pernik, Bulgaria", latitude: 42.605, longitude: 23.0378 },
  { label: "Haskovo, Bulgaria", latitude: 41.9344, longitude: 25.5556 },
  { label: "Yambol, Bulgaria", latitude: 42.4839, longitude: 26.5013 },
  { label: "Pazardzhik, Bulgaria", latitude: 42.1928, longitude: 24.3336 },
  { label: "Blagoevgrad, Bulgaria", latitude: 42.0209, longitude: 23.0943 },
];

export function filterServiceLocations(query: string): ServiceLocationOption[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...SERVICE_LOCATIONS];
  }
  return SERVICE_LOCATIONS.filter((loc) => loc.label.toLowerCase().includes(q));
}

export function findServiceLocation(label: string): ServiceLocationOption | undefined {
  const trimmed = label.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return SERVICE_LOCATIONS.find((loc) => loc.label.toLowerCase() === trimmed);
}
