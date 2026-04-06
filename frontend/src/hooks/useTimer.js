import { useState, useEffect, useRef, useCallback } from "react";

export function useTimer(duration, onExpire) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const start = useCallback((d) => {
    setTimeLeft(d ?? duration);
    setIsRunning(true);
  }, [duration]);

  const stop = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback((d) => {
    stop();
    setTimeLeft(d ?? duration);
  }, [stop, duration]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const progress = duration > 0 ? timeLeft / duration : 0; 

  return { timeLeft, progress, isRunning, start, stop, reset };
}
