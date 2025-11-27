'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
  tier: {
    name: string;
    features: string[];
    limits: { requests: number };
  };
}

interface Usage {
  requests: number;
  cost: number;
  period: {
    start: string;
    end: string;
  };
}

interface Invoice {
  id: string;
  number: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string;
  hosted_url: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [subRes, usageRes, invRes, pmRes] = await Promise.all([
        fetch('/api/stripe/subscription'),
        fetch('/api/stripe/usage'),
        fetch('/api/stripe/invoices'),
        fetch('/api/stripe/payment-methods')
      ]);

      if (!subRes.ok || !usageRes.ok || !invRes.ok || !pmRes.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const [subData, usageData, invData, pmData] = await Promise.all([
        subRes.json(),
        usageRes.json(),
        invRes.json(),
        pmRes.json()
      ]);

      setSubscription(subData.subscription);
      setUsage(usageData.usage);
      setInvoices(invData.invoices);
      setPaymentMethods(pmData.paymentMethods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade');
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchData} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usagePercentage = subscription ? (usage ? (usage.requests / subscription.tier.limits.requests) * 100 : 0) : 0;

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
            {subscription ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold">{subscription.tier.name} Tier</h3>
                  <p className="text-sm text-muted-foreground">
                    ${(subscription.price.amount / 100).toFixed(2)}/{subscription.price.interval}
                  </p>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Features</h4>
                  <ul className="list-disc list-inside text-sm">
                    {subscription.tier.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Usage this month</h4>
                  <Progress value={Math.min(usagePercentage, 100)} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {usage ? usage.requests.toLocaleString() : 0} of {subscription.tier.limits.requests.toLocaleString()} requests used
                    {usage && <span> (${usage.cost.toFixed(2)} spent)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleUpgrade('price_pro')}>Upgrade Plan</Button>
                  <Button variant="outline" onClick={handleManageBilling}>Manage Billing</Button>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-semibold">Free Tier</h3>
                <p className="text-sm text-muted-foreground">No active subscription</p>
                <Button onClick={() => handleUpgrade('price_starter')}>Upgrade to Starter</Button>
              </div>
            )}
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
            {paymentMethods.length > 0 ? (
              paymentMethods.map((pm) => (
                <div key={pm.id}>
                  {pm.card && (
                    <>
                      <p className="text-sm">{pm.card.brand.toUpperCase()} **** **** **** {pm.card.last4}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires {pm.card.exp_month}/{pm.card.exp_year}
                      </p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payment method on file</p>
            )}
            <Button variant="outline" onClick={handleManageBilling}>Update Payment Method</Button>
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
          {invoices.length > 0 ? (
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
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{new Date(invoice.date * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(invoice.pdf_url, '_blank')}
                      >
                        Download PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No billing history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}