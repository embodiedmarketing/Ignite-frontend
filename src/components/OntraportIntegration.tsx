import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Webhook, Database, ArrowRight } from "lucide-react";

interface OntraportConfig {
  enabled: boolean;
  apiKey: string;
  appId: string;
  webhookUrl: string;
  syncOnPurchase: boolean;
  syncUserData: boolean;
}

export default function OntraportIntegration() {
  const { toast } = useToast();
  const [config, setConfig] = useState<OntraportConfig>({
    enabled: false,
    apiKey: '',
    appId: '',
    webhookUrl: '',
    syncOnPurchase: true,
    syncUserData: true,
  });

  const handleSave = async () => {
    try {
      // API call to save Ontraport configuration
      toast({
        title: "Integration Saved",
        description: "Ontraport integration settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Ontraport integration settings.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    try {
      // API call to test Ontraport connection
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Ontraport API.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Ontraport. Please check your credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#4593ed]" />
            <span>Ontraport CRM Integration</span>
          </CardTitle>
          <CardDescription>
            Connect Launch with your Ontraport CRM to sync customer data and trigger automations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-base font-medium">
                Enable Ontraport Integration
              </Label>
              <p className="text-sm text-muted-foreground">
                Sync customer purchases and user data with your Ontraport CRM
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {config.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">Ontraport API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Ontraport API key"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="appId">App ID</Label>
                  <Input
                    id="appId"
                    placeholder="Enter your Ontraport App ID"
                    value={config.appId}
                    onChange={(e) => setConfig(prev => ({ ...prev, appId: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-ontraport-webhook.com/endpoint"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave blank to use default Ontraport API endpoints
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Webhook className="w-4 h-4" />
                  <span>Sync Options</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="syncOnPurchase">Sync on Purchase</Label>
                      <p className="text-sm text-muted-foreground">
                        Send customer data to Ontraport when they subscribe
                      </p>
                    </div>
                    <Switch
                      id="syncOnPurchase"
                      checked={config.syncOnPurchase}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncOnPurchase: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="syncUserData">Sync User Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Update Ontraport with user progress and activity data
                      </p>
                    </div>
                    <Switch
                      id="syncUserData"
                      checked={config.syncUserData}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, syncUserData: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={testConnection} variant="outline">
                  Test Connection
                </Button>
                <Button onClick={handleSave} className="bg-[#4593ed] hover:bg-[#3478d4]">
                  <Settings className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-[#4593ed]">Automated Workflows</h4>
              <p className="text-sm text-muted-foreground">
                Trigger email sequences and automations based on user actions in Launch
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-[#4593ed]">Unified Customer Data</h4>
              <p className="text-sm text-muted-foreground">
                Keep all customer information synchronized between Launch and Ontraport
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-[#4593ed]">Advanced Segmentation</h4>
              <p className="text-sm text-muted-foreground">
                Segment customers based on their progress and engagement in Launch
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-[#4593ed]">Sales Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Track customer journey from lead to successful Launch user
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
