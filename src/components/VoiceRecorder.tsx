import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Square, Play, Pause, Volume2, Loader2, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscriptComplete: (cleanedText: string) => void;
  questionContext: string;
  placeholder?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceRecorder({ onTranscriptComplete, questionContext, placeholder }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Audio cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async ({ transcript, questionContext }: { transcript: string; questionContext: string }) => {
      return apiRequest("POST", "/api/cleanup-transcript", { transcript, questionContext });
    },
    onSuccess: (data: any) => {
      const cleanedText = data.cleanedText || transcript.trim();
      onTranscriptComplete(cleanedText);
      setTranscript("");
      setRecordingTime(0);
      toast({
        title: "Voice response added",
        description: "Your audio has been transcribed and added to the response!"
      });
    },
    onError: (error: any) => {
      console.error("Cleanup error:", error);
      // Fallback: use the raw transcript if cleanup fails
      onTranscriptComplete(transcript.trim());
      setTranscript("");
      setRecordingTime(0);
      toast({
        title: "Voice response added",
        description: "Your audio has been transcribed (basic cleanup applied)."
      });
    }
  });

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Only update with final transcript to avoid duplicates
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        toast({
          title: "Recording error",
          description: "There was an issue with voice recording. Please try again.",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [toast]);

  const startRecording = () => {
    if (!recognitionRef.current) return;

    setTranscript("");
    setRecordingTime(0);
    setIsRecording(true);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const processTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No audio detected",
        description: "Please record some audio before processing.",
        variant: "destructive"
      });
      return;
    }

    cleanupMutation.mutate({ transcript: transcript.trim(), questionContext });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Volume2 className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Voice recording is not supported in your browser. Please use Chrome, Safari, or Edge for voice input functionality.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {!isRecording && !transcript && (
        <Button
          onClick={startRecording}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
          title="Record voice message"
        >
          <Mic className="w-4 h-4 text-slate-500" />
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <Button
            onClick={stopRecording}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-100 rounded-full animate-pulse"
            title="Stop recording"
          >
            <Square className="w-4 h-4 text-red-500 fill-current" />
          </Button>
          <span className="text-xs text-red-500 font-medium">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {transcript && !isRecording && (
        <Button
          onClick={processTranscript}
          size="sm"
          variant="ghost"
          disabled={cleanupMutation.isPending}
          className="h-8 w-8 p-0 hover:bg-green-100 rounded-full"
          title={cleanupMutation.isPending ? "Processing..." : "Use voice response"}
        >
          {cleanupMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <Play className="w-4 h-4 text-green-600 fill-current" />
          )}
        </Button>
      )}

      {transcript && !isRecording && (
        <div className="absolute top-10 left-0 z-10 w-64 p-3 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="max-h-32 overflow-y-auto text-sm text-slate-700 mb-2">
            {transcript}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={processTranscript}
              size="sm"
              disabled={cleanupMutation.isPending}
              className="flex-1"
            >
              {cleanupMutation.isPending ? "Processing..." : "Use This"}
            </Button>
            <Button
              onClick={() => setTranscript("")}
              size="sm"
              variant="outline"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
