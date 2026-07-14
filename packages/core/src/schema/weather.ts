import { z } from "zod";

export const weatherConfigSchema = z.object({
  enabled: z.boolean(),
  city: z.string(),
  units: z.enum(["metric", "imperial"]),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  cache: z
    .object({
      temp: z.number(),
      feelsLike: z.number(),
      weatherCode: z.number(),
      windSpeed: z.number(),
      ts: z.number(),
      resolvedName: z.string(),
    })
    .nullable(),
});

export type WeatherConfig = z.infer<typeof weatherConfigSchema>;
