import React, { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

export function LoadingBar({ isLoading }: LoadingBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + (90 - prev) * 0.1;
        });
      }, 100);
    } else {
      setProgress(prev => prev < 100 ? 100 : 0);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            transition: isLoading ? 'width 0.3s ease-out' : 'width 0.1s ease-in'
          }}
        />
      </div>
    </div>
  );
}