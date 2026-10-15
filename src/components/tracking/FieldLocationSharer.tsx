import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { liveLocationService } from '../../services/liveLocationService';
import {
  Navigation,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Compass,
  Battery
} from 'lucide-react';

export const FieldLocationSharer: React.FC = () => {
  const { currentUser, isFieldStaff } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; accuracy: number; speed: number; time: string } | null>(null);
  const [batteryPct, setBatteryPct] = useState<number | undefined>(undefined);

  const watchIdRef = useRef<number | null>(null);

  // Check browser geolocation & battery support
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionState('unsupported');
    }

    // Try reading device battery level if supported
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery?.().then((bat: any) => {
        if (bat) {
          setBatteryPct(Math.round(bat.level * 100));
          bat.addEventListener('levelchange', () => {
            setBatteryPct(Math.round(bat.level * 100));
          });
        }
      }).catch(() => {});
    }
  }, []);

  // Stop watching and notify when unmounting
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      liveLocationService.setLocationSharingActive(false);
    };
  }, []);

  if (!currentUser || !isFieldStaff) {
    return null;
  }

  const startSharing = () => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return;
    }

    setErrorMessage(null);
    setIsSharing(true);
    liveLocationService.setLocationSharingActive(true);

    // Immediately send presence with isSharingLocation = true
    liveLocationService.sendHeartbeat({
      userId: currentUser.id,
      employeeCode: currentUser.employeeId,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      isSharingLocation: true
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPermissionState('granted');
        setErrorMessage(null);

        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        setLastCoords({
          lat: parseFloat(latitude.toFixed(5)),
          lng: parseFloat(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
          speed: speed ? Math.round(speed * 3.6) : 0,
          time: new Date().toLocaleTimeString()
        });

        // Broadcast real GPS fix to liveLocationService (backed by Pusher & backend)
        liveLocationService.updateEmployeeLocation(currentUser.id, {
          latitude,
          longitude,
          accuracy,
          speed: speed ? Math.round(speed * 3.6) : undefined,
          heading: heading !== null && !isNaN(heading) ? heading : undefined,
          batteryLevel: batteryPct,
          employeeCode: currentUser.employeeId,
          name: currentUser.name,
          role: currentUser.role
        });
      },
      (error) => {
        // Handle GPS errors gracefully without marking employee offline
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          setIsSharing(false);
          liveLocationService.setLocationSharingActive(false);
          setErrorMessage('Location permission denied. Please enable GPS in browser site settings.');
          liveLocationService.sendHeartbeat({
            userId: currentUser.id,
            employeeCode: currentUser.employeeId,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            isSharingLocation: false
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          // Keep sharing state active: device is acquiring satellite lock
          setErrorMessage('Acquiring GPS fix... (Device is searching for satellite signal)');
        } else if (error.code === error.TIMEOUT) {
          // Timeout is temporary; continue watching
          setErrorMessage('GPS signal weak; retrying satellite lock...');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000
      }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    liveLocationService.setLocationSharingActive(false);
    setErrorMessage(null);

    // Update presence with location sharing paused
    liveLocationService.sendHeartbeat({
      userId: currentUser.id,
      employeeCode: currentUser.employeeId,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      isSharingLocation: false
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${isSharing ? 'bg-emerald-500 text-white animate-pulse' : 'bg-amber-500 text-white'}`}>
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900">
              Field Worker Live GPS Dispatch
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSharing ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {isSharing ? '● Live Sharing Active' : 'Standby'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isSharing && lastCoords
              ? `Transmitting real-time GPS coordinates (${lastCoords.lat}°, ${lastCoords.lng}°) ±${lastCoords.accuracy}m at ${lastCoords.time}`
              : 'Broadcast your current GPS location to the central Admin dispatch map.'}
          </p>
          {errorMessage && (
            <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isSharing ? (
          <button
            onClick={stopSharing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-amber-600" />
            <span>Pause Sharing</span>
          </button>
        ) : (
          <button
            onClick={startSharing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Share My Location</span>
          </button>
        )}
      </div>
    </div>
  );
};
