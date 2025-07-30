import geoip from 'geoip-lite';

export interface LocationData {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ll?: [number, number]; // latitude, longitude
}

export function getLocationFromIP(ip: string): LocationData | null {
  try {
    // Handle localhost and private IPs
    if (!ip || ip === 'localhost' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: 'Local',
        region: 'Development',
        city: 'Localhost',
        timezone: 'UTC'
      };
    }

    // Get geolocation data
    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC'
      };
    }

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      ll: geo.ll
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: 'Error',
      region: 'Error',
      city: 'Error',
      timezone: 'UTC'
    };
  }
}

export function formatLocation(location: LocationData | null): string {
  if (!location) return 'Unknown';
  
  const parts = [];
  
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

export function getLocationDisplay(ip: string): string {
  const location = getLocationFromIP(ip);
  const formattedLocation = formatLocation(location);
  
  return `${formattedLocation} (${ip})`;
} 