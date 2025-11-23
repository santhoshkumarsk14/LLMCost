import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Current Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Pro Tier</h3>
              <p className="text-sm text-muted-foreground">$29/month</p>
            </div>
            <div>
              <h4 className="font-medium">Features</h4>
              <ul className="list-disc list-inside text-sm">
                <li>Unlimited API calls</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Usage this month</h4>
              <Progress value={75} className="w-full" />
              <p className="text-sm text-muted-foreground">75% of 10,000 calls used</p>
            </div>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm">**** **** **** 1234</p>
              <p className="text-sm text-muted-foreground">Expires 12/25</p>
            </div>
            <Button variant="outline">Update Payment Method</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2023-10-01</TableCell>
                <TableCell>$29.00</TableCell>
                <TableCell><Badge variant="secondary">Paid</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm">Download PDF</Button></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2023-09-01</TableCell>
                <TableCell>$29.00</TableCell>
                <TableCell><Badge variant="secondary">Paid</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm">Download PDF</Button></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2023-08-01</TableCell>
                <TableCell>$29.00</TableCell>
                <TableCell><Badge variant="secondary">Paid</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm">Download PDF</Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}