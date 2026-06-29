import { Users } from "lucide-react";
import BusinessIncubatorVideoSeries from "@/components/BusinessIncubatorVideoSeries";

export default function BusinessIncubatorCustomerJourney() {
  return (
    <BusinessIncubatorVideoSeries
      apiPath="/api/business-incubator/customer-journey-videos"
      title="Business Incubator: Your Customer Journey"
      description="Exclusive workshop series hosted live with Emily Hirsh - Map and optimize every touchpoint in your customer's experience"
      themeColor="purple"
      icon={Users}
      stepNumberBase={200}
    />
  );
}
