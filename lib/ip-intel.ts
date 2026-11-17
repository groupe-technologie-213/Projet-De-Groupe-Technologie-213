import { isIP } from "node:net";

export type IpIntel = {
  latitude: number;
  longitude: number;
  country: string | null;
  city: string | null;
  isp: string | null;
};

type IpWhoisResponse = {
  success?: boolean;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  connection?: { isp?: string };
};

export async function lookupIp(ipAddress: string): Promise<IpIntel | null> {
  const ip = ipAddress.trim();
  if (!isIP(ip)) return null;

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data: IpWhoisResponse = await response.json();
    const { latitude, longitude } = data;

    if (
      data.success !== true ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
      country: data.country ?? null,
      city: data.city ?? null,
      isp: data.connection?.isp ?? null,
    };
  } catch {
    return null;
  }
}