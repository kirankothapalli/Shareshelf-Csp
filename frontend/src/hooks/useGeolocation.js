import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_COORDS = { lat: 16.5449, lng: 81.5212 }; // Bhimavaram fallback

const STATUS = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  FALLBACK_IP: 'fallback_ip',
  FALLBACK_DEFAULT: 'fallback_default',
  ERROR: 'error',
};

const STATUS_MESSAGES = {
  [STATUS.IDLE]: '',
  [STATUS.DETECTING]: 'Detecting your location…',
  [STATUS.GRANTED]: 'Using your precise location',
  [STATUS.DENIED]: 'Location access denied — showing default area',
  [STATUS.UNAVAILABLE]: 'Location unavailable — using approximate location',
  [STATUS.FALLBACK_IP]: 'Using approximate location based on your network',
  [STATUS.FALLBACK_DEFAULT]: 'Could not detect location — showing Bhimavaram area',
  [STATUS.ERROR]: 'Location detection error',
};

/**
 * Robust geolocation hook with a 4-tier fallback chain:
 *   1. High-accuracy GPS (10s timeout)
 *   2. Low-accuracy Wi-Fi / cell tower (5s timeout)
 *   3. IP-based geolocation via free API
 *   4. Hardcoded default coordinates
 *
 * @param {Object} options
 * @param {boolean} options.enableOnMount - Start detecting immediately (default true)
 * @param {Function} options.onError - Error callback for logging
 */
export default function useGeolocation({ enableOnMount = true, onError } = {}) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [source, setSource] = useState(null); // 'gps' | 'wifi' | 'ip' | 'default'
  const attemptedRef = useRef(false);

  const logError = useCallback((msg, err) => {
    console.warn(`[useGeolocation] ${msg}`, err?.message || err || '');
    onError?.(msg, err);
  }, [onError]);

  // Tier 1: High-accuracy (GPS)
  const tryHighAccuracy = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API not available'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  // Tier 2: Low-accuracy (Wi-Fi / cell tower)
  const tryLowAccuracy = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API not available'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'wifi' }),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    });
  }, []);

  // Tier 3: IP-based geolocation
  const tryIPGeolocation = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`IP API returned ${res.status}`);
      const data = await res.json();

      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude, source: 'ip' };
      }
      throw new Error('IP API returned no coordinates');
    } catch (err) {
      throw new Error(`IP geolocation failed: ${err.message}`);
    }
  }, []);

  // Tier 4: Default coordinates
  const useDefault = useCallback(() => {
    return { ...DEFAULT_COORDS, source: 'default' };
  }, []);

  // Main detection chain
  const detect = useCallback(async () => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    setStatus(STATUS.DETECTING);

    // Check if running in secure context (HTTPS required for geolocation)
    const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

    // Check permission state if available
    let permissionState = null;
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        permissionState = perm.state;

        if (perm.state === 'denied') {
          logError('Location permission is denied by user/browser settings');
          setStatus(STATUS.DENIED);
          // Skip directly to IP fallback
          try {
            const ipResult = await tryIPGeolocation();
            setCoords({ lat: ipResult.lat, lng: ipResult.lng });
            setSource(ipResult.source);
            setStatus(STATUS.FALLBACK_IP);
            return;
          } catch {
            const def = useDefault();
            setCoords({ lat: def.lat, lng: def.lng });
            setSource(def.source);
            setStatus(STATUS.FALLBACK_DEFAULT);
            return;
          }
        }
      }
    } catch {
      // permissions API not supported (e.g. some Safari versions) — continue anyway
    }

    if (!isSecure) {
      logError('Not in a secure context (HTTPS). Geolocation API may be blocked.');
    }

    // Tier 1: High accuracy
    try {
      const result = await tryHighAccuracy();
      setCoords({ lat: result.lat, lng: result.lng });
      setSource(result.source);
      setStatus(STATUS.GRANTED);
      return;
    } catch (err) {
      logError('High-accuracy geolocation failed', err);
    }

    // Tier 2: Low accuracy
    try {
      const result = await tryLowAccuracy();
      setCoords({ lat: result.lat, lng: result.lng });
      setSource(result.source);
      setStatus(STATUS.GRANTED);
      return;
    } catch (err) {
      logError('Low-accuracy geolocation failed', err);
    }

    // Tier 3: IP-based
    try {
      const result = await tryIPGeolocation();
      setCoords({ lat: result.lat, lng: result.lng });
      setSource(result.source);
      setStatus(STATUS.FALLBACK_IP);
      return;
    } catch (err) {
      logError('IP-based geolocation failed', err);
    }

    // Tier 4: Default
    const def = useDefault();
    setCoords({ lat: def.lat, lng: def.lng });
    setSource(def.source);
    setStatus(STATUS.FALLBACK_DEFAULT);
    logError('All geolocation methods failed, using default coordinates');
  }, [tryHighAccuracy, tryLowAccuracy, tryIPGeolocation, useDefault, logError]);

  // Retry function — resets state and re-runs detection
  const retry = useCallback(() => {
    attemptedRef.current = false;
    setCoords(null);
    setSource(null);
    setStatus(STATUS.IDLE);
    detect();
  }, [detect]);

  useEffect(() => {
    if (enableOnMount) {
      detect();
    }
  }, [enableOnMount, detect]);

  return {
    coords,
    status,
    source,
    statusMessage: STATUS_MESSAGES[status] || '',
    isLoading: status === STATUS.DETECTING,
    isError: [STATUS.DENIED, STATUS.UNAVAILABLE, STATUS.ERROR].includes(status),
    isFallback: [STATUS.FALLBACK_IP, STATUS.FALLBACK_DEFAULT].includes(status),
    detect,
    retry,
  };
}
