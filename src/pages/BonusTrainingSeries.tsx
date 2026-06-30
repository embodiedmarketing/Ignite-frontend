import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play } from "lucide-react";
import BonusTrainingVideoSeries from "@/components/BonusTrainingVideoSeries";
import type { BonusTrainingSeries, BonusTrainingThemeColor } from "@/types/bonusTrainings";

export default function BonusTrainingSeriesPage() {
  const params = useParams<{ seriesId: string }>();
  const seriesId = params.seriesId;

  const { data: series, isLoading, error } = useQuery({
    queryKey: [`/api/bonus-trainings/series/${seriesId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bonus-trainings/series/${seriesId}`);
      return response.json() as Promise<BonusTrainingSeries>;
    },
    enabled: Boolean(seriesId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">Series not found</p>
        <p className="text-sm text-slate-500 mt-2">
          {error instanceof Error ? error.message : "This training series may have been removed."}
        </p>
        <Link href="/resources/bonus-trainings">
          <Button variant="outline" className="mt-4">
            ← Back to Trainings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <BonusTrainingVideoSeries
      seriesId={series.id}
      title={series.title}
      description={series.description}
      themeColor={(series.themeColor as BonusTrainingThemeColor) ?? "purple"}
      icon={Play}
      stepNumberBase={series.stepNumberBase ?? 100}
    />
  );
}
