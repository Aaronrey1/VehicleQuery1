import geoip from 'geoip-lite';
import type { Request } from 'express';

export function getClientIp(req: Request): string {
  // Check for IP in various headers (for proxies/load balancers)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIp = req.headers['x-real-ip'];
  
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  
  return req.socket.remoteAddress || 'unknown';
}

export function getCountryFromIp(ip: string): string | null {
  // Handle localhost and private IPs
  if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'LOCAL';
  }
  
  const geo = geoip.lookup(ip);
  return geo?.country || null;
}

export function getClientCountry(req: Request): string | null {
  const ip = getClientIp(req);
  return getCountryFromIp(ip);
}
