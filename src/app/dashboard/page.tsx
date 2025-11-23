'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  Activity,
  Calculator,
  Plus,
  Settings,
  Download,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

interface DashboardData {
  totalSpend: number
  requestsCount: number
  moneySaved: number
  avgCost: number
  spendingData: { date: string; spend: number }[]
  modelCostData: { model: string; cost: number }[]
  recentRequests: { id: string; model: string; cost: number; created_at: string }[]
}

async function getDashboardData() {
  try {
    // Get metrics
    const { data: totalSpendData, error: totalSpendError } = await supabase
      .from('api_requests')
      .select('cost')

    if (totalSpendError) throw totalSpendError

    const totalSpend = totalSpendData?.reduce((sum, req) => sum + (req.cost || 0), 0) || 0

    const { count: requestsCount, error: countError } = await supabase
      .from('api_requests')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    const { data: moneySavedData, error: moneySavedError } = await supabase
      .from('api_requests')
      .select('cost')
      .eq('status', 'cached')

    if (moneySavedError) throw moneySavedError

    const moneySaved = moneySavedData?.reduce((sum, req) => sum + (req.cost || 0), 0) || 0

    const avgCost = totalSpendData?.length ? totalSpend / totalSpendData.length : 0

    // Get spending over 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: spendingRawData, error: spendingError } = await supabase
      .from('api_requests')
      .select('created_at, cost')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at')

    if (spendingError) throw spendingError

    const spendingGrouped = spendingRawData?.reduce((acc, req) => {
      const date = new Date(req.created_at).toLocaleDateString()
      acc[date] = (acc[date] || 0) + (req.cost || 0)
      return acc
    }, {} as Record<string, number>) || {}

    const spendingData = Object.entries(spendingGrouped).map(([date, spend]) => ({ date, spend }))

    // Get cost by model
    const { data: modelRawData, error: modelError } = await supabase
      .from('api_requests')
      .select('model, cost')

    if (modelError) throw modelError

    const modelGrouped = modelRawData?.reduce((acc, req) => {
      acc[req.model] = (acc[req.model] || 0) + (req.cost || 0)
      return acc
    }, {} as Record<string, number>) || {}

    const modelCostData = Object.entries(modelGrouped).map(([model, cost]) => ({ model, cost }))

    // Get recent requests
    const { data: recentRequests, error: recentError } = await supabase
      .from('api_requests')
      .select('id, model, cost, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    return {
      totalSpend,
      requestsCount: requestsCount || 0,
      moneySaved,
      avgCost,
      spendingData,
      modelCostData,
      recentRequests: recentRequests || []
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return default values on error
    return {
      totalSpend: 0,
      requestsCount: 0,
      moneySaved: 0,
      avgCost: 0,
      spendingData: [],
      modelCostData: [],
      recentRequests: []
    }
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalSpend: 0,
    requestsCount: 0,
    moneySaved: 0,
    avgCost: 0,
    spendingData: [],
    modelCostData: [],
    recentRequests: []
  })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const newData = await getDashboardData()
    setData(newData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscriptions
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'api_requests' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'optimization_rules' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const {
    totalSpend,
    requestsCount,
    moneySaved,
    avgCost,
    spendingData,
    modelCostData,
    recentRequests
  } = data
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total spend
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Made</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total requests
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${moneySaved.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Money saved
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost per Request</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Avg cost per request
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Spending Over 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spend']} />
                <Line type="monotone" dataKey="spend" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']} />
                <Bar dataKey="cost" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id} className="border-b">
                    <td className="p-2">
                      <Badge variant="secondary">{request.model}</Badge>
                    </td>
                    <td className="p-2">${request.cost}</td>
                    <td className="p-2">{new Date(request.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Budget
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}