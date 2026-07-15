export type WeatherCategory = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

// Open-Meteo returns WMO weather interpretation codes
// (https://open-meteo.com/en/docs — "WMO Weather interpretation codes").
export function weatherCodeToCategory(code: number): WeatherCategory {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}
