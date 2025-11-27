import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, Bell, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/billing">
              <Button className="w-full">
                Manage Billing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure alerts and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/notifications">
              <Button className="w-full">
                Manage Notifications
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Update password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/security">
              <Button className="w-full">
                Manage Security
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}