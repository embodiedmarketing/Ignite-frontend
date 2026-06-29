import { MessageSquare } from "lucide-react";
import BusinessIncubatorVideoSeries from "@/components/BusinessIncubatorVideoSeries";

export default function BusinessIncubatorMessaging() {
  return (
    <BusinessIncubatorVideoSeries
      apiPath="/api/business-incubator/messaging-videos"
      title="Business Incubator: Your Messaging"
      description="Exclusive workshop series hosted live with Emily Hirsh - Advanced messaging strategies and frameworks"
      themeColor="blue"
      icon={MessageSquare}
      stepNumberBase={100}
    />
  );
}
