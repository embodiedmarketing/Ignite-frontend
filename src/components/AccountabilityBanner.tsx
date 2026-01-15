import { useQuery, useMutation } from "@tanstack/react-query";
import { X, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/services/queryClient";
import { apiClient } from "@/services/api.config";

interface ParticipationStatus {
  hasParticipated: boolean;
  participatedAt: string | null;
  weekStartDate: string;
  weekEndDate: string;
  threadId: number;
  noActiveThread?: boolean;
}

export function AccountabilityBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  // Query to check participation status
  const { data: participationStatus, isLoading } = useQuery<ParticipationStatus>({
    queryKey: ["/api/accountability/participation-status"],
    queryFn: async () => {
      const { data } = await apiClient.get<ParticipationStatus>("/api/accountability/participation-status");
      return data;
    },
    refetchInterval: 60000, // Check every minute
  });


  // Don't show if:
  // - Loading
  // - Dismissed
  // - User has already participated
  // - No active thread
  if (
    isLoading ||
    isDismissed ||
    participationStatus?.hasParticipated ||
    participationStatus?.noActiveThread
  ) {
    return null;
  }

  // Format the week date range
  const formatWeekRange = () => {
    if (!participationStatus) return "";
    const start = new Date(participationStatus.weekStartDate);
    const end = new Date(participationStatus.weekEndDate);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  return (
    <div
      className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm"
      data-testid="accountability-banner"
    >
      {/* Close button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
        data-testid="button-dismiss-accountability-banner"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            📅 Weekly Accountability Check-in
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Join this week's accountability thread ({formatWeekRange()}) and share your progress with us!
          </p>

          <div className="bg-white/60 rounded-md p-3 mb-3 border border-blue-100">
            <p className="text-sm text-slate-700 font-medium mb-2">Tell us:</p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Where you are in the program</li>
              <li>Your specific goals for this week</li>
              <li>Any challenges you're facing</li>
            </ul>
          </div>

          <Link
            href={`/forum/thread/${participationStatus?.threadId}`}
            data-testid="link-go-to-accountability-thread"
          >
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Go to Accountability Thread
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
