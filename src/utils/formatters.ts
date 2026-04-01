/**
 * Formatting utilities for maritime sensor values and timestamps.
 */

export function formatRPM(value: number): string {
  return `${Math.round(value)} RPM`;
}

export function formatTemperature(celsius: number, decimals = 1): string {
  return `${celsius.toFixed(decimals)} \u00b0C`;
}

export function formatPressure(kpa: number, unit: 'bar' | 'kPa' = 'bar'): string {
  if (unit === 'bar') {
    const bar = kpa / 100;
    return `${bar.toFixed(2)} bar`;
  }
  return `${Math.round(kpa)} kPa`;
}

export function formatTimestamp(isoOrMs: string | number): string {
  const date = typeof isoOrMs === 'string' ? new Date(isoOrMs) : new Date(isoOrMs);
  if (isNaN(date.getTime())) {
    return '--:--:--';
  }
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function formatRunningHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours.toLocaleString('en-GB')}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatFuelRate(litersPerHour: number): string {
  return `${litersPerHour.toFixed(1)} L/h`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
