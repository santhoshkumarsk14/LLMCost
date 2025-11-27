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
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Server,
  Shield,
  TrendingUp,
  Zap
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface SystemMetrics {
  health: {
    status: 'healthy' | 'unhealthy' | 'warning'
    timestamp: string
    checks: Record<string, { status: string, details: string }>
  }
  performance: {
    averageResponseTime: number
    totalRequests: number
    errorRate: number
    cacheHitRate: number
    memoryUsage: number
  }
  audit: {
    total: number
    byLevel: Record<string, number>
    bySource: Record<string, number>
    recentEvents: Array<{
      id: string
      level: string
      message: string
      source: string
      created_at: string
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    try {
      // Fetch health status
      const healthResponse = await fetch('/api/health')
      const health = await healthResponse.json()

      // Fetch audit logs
      const auditResponse = await fetch('/api/audit?limit=50')
      const audit = await auditResponse.json()

      setMetrics({
        health,
        performance: health.metrics.performance,
        audit: audit.summary ? {
          ...audit.summary,
          recentEvents: audit.logs.slice(0, 10)
        } : {
          total: 0,
          byLevel: {},
          bySource: {},
          recentEvents: []
        }
      })
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Monitoring</h1>
        </div>
        <div>Loading monitoring data...</div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Monitoring</h1>
        </div>
        <div>Failed to load monitoring data</div>
      </div>
    )
  }

  const { health, performance, audit } = metrics

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <Button onClick={fetchMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Health Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {health.status === 'healthy' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : health.status === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{health.status}</div>
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(performance.errorRate * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Error rate
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(performance.cacheHitRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cache efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Checks */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>System Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(health.checks).map(([check, details]) => (
              <div key={check} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium capitalize">{check}</div>
                  <div className="text-sm text-muted-foreground">{details.details}</div>
                </div>
                <Badge variant={details.status === 'healthy' ? 'default' : 'destructive'}>
                  {details.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {(performance.memoryUsage / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${Math.min((performance.memoryUsage / 100000000) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current heap usage
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Audit Events by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(audit.byLevel).map(([level, count]) => ({
                    name: level,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {Object.entries(audit.byLevel).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Events */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audit.recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant={
                    event.level === 'error' ? 'destructive' :
                    event.level === 'warn' ? 'secondary' : 'default'
                  }>
                    {event.level}
                  </Badge>
                  <div>
                    <div className="font-medium">{event.message}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.source} • {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <Card className="backdrop-blur-md bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{performance.totalRequests}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{audit.total}</div>
              <div className="text-sm text-muted-foreground">Audit Events</div>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{process.uptime().toFixed(0)}s</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}