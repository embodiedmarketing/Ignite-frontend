import React, { useState, useEffect, useRef } from 'react';

interface VimeoEmbedProps {
  vimeoId: string;
  title: string;
  userId: number;
  stepNumber: number;
  startTime?: number;
}

export default function VimeoEmbed({ vimeoId, title, userId, stepNumber, startTime = 0 }: VimeoEmbedProps) {
  const [watchTime, setWatchTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const estimatedDuration = 12 * 60; // 12 minutes in seconds
  const completionThreshold = Math.floor(estimatedDuration * 0.8); // 80% completion
  const playerReadyRef = useRef(false);

  useEffect(() => {
    // Check if video was already completed
    const completionKey = `video_completed_${vimeoId}`;
    const wasCompleted = localStorage.getItem(completionKey) === 'true';
    if (wasCompleted) {
      setIsCompleted(true);
    }
  }, [vimeoId]);

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    if (!isCompleted && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          if (newTime >= completionThreshold && !isCompleted) {
            setIsCompleted(true);
            const completionKey = `video_completed_${vimeoId}`;
            localStorage.setItem(completionKey, 'true');
            // Video completion tracked in localStorage
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatWatchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract clean Vimeo ID from URL format
  const cleanVimeoId = vimeoId.includes('/') ? vimeoId.split('/')[0] : vimeoId;
  
  // Seek to startTime when it changes and player is ready
  useEffect(() => {
    if (startTime > 0 && iframeRef.current && playerReadyRef.current) {
      const message = {
        method: 'setCurrentTime',
        value: startTime
      };
      iframeRef.current.contentWindow?.postMessage(JSON.stringify(message), 'https://player.vimeo.com');
    }
  }, [startTime]);

  const vimeoUrl = `https://player.vimeo.com/video/${cleanVimeoId}?h=${vimeoId.includes('/') ? vimeoId.split('/')[1] : ''}&badge=0&autopause=0&player_id=0&app_id=58479`;

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
        <iframe
          ref={iframeRef}
          key={`${vimeoId}-player`}
          src={vimeoUrl}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          onLoad={() => {
            // Mark player as ready
            playerReadyRef.current = true;
            
            // Setup message listener for Vimeo player events
            const handleMessage = (event: MessageEvent) => {
              if (event.origin !== 'https://player.vimeo.com') return;
              
              try {
                const data = JSON.parse(event.data);
                if (data.event === 'play') {
                  handlePlay();
                } else if (data.event === 'pause') {
                  handlePause();
                } else if (data.event === 'ready') {
                  playerReadyRef.current = true;
                  // Seek to startTime if specified
                  if (startTime > 0 && iframeRef.current) {
                    const seekMessage = {
                      method: 'setCurrentTime',
                      value: startTime
                    };
                    iframeRef.current.contentWindow?.postMessage(JSON.stringify(seekMessage), 'https://player.vimeo.com');
                  }
                }
              } catch (e) {
                // Ignore parsing errors from other messages
              }
            };
            
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
          }}
        />
      </div>
      
      {!isCompleted && watchTime > 0 && (
        <div className="text-sm text-slate-600 text-center">
          Watch time: {formatWatchTime(watchTime)} | Complete at: {formatWatchTime(completionThreshold)}
        </div>
      )}
      
      {isCompleted && (
        <div className="text-sm text-green-600 text-center font-semibold">
          Video completed! ✓
        </div>
      )}
    </div>
  );
}
