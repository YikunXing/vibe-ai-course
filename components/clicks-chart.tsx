"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import Toast from "./toast-notification"
import { showErrorToast } from "@/lib/utils"

interface ClicksChartProps {
  // Props for database integration
  data: Array<{ period: string; clicks: number }>
  totalClicks: number
  onPeriodChange?: (period: string) => void
  loading?: boolean
}

export default function ClicksChart({ 
  data: initialData, 
  totalClicks: initialTotalClicks,
  onPeriodChange,
  loading: initialLoading = false 
}: ClicksChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1m')
  const [chartData, setChartData] = useState(initialData)
  const [totalClicks, setTotalClicks] = useState(initialTotalClicks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorToastState, setShowErrorToastState] = useState(false)
  const periods = [
    { value: '1d', label: '1d' },
    { value: '1w', label: '1w' },
    { value: '1m', label: '1m' },
    { value: '6m', label: '6m' },
    { value: '1y', label: '1y' }
  ]

  // Update chart data when initial data changes
  useEffect(() => {
    setChartData(initialData)
    setTotalClicks(initialTotalClicks)
  }, [initialData, initialTotalClicks])

  const fetchAnalyticsData = async (period: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setChartData(result.data)
        setTotalClicks(result.totalClicks)
      } else {
        const errorMessage = `Failed to fetch analytics data: ${response.status} ${response.statusText}`
        setError(errorMessage)
        setShowErrorToastState(true)
        console.error('Failed to fetch analytics data:', response.status, response.statusText)
      }
    } catch (error) {
      const errorMessage = showErrorToast(error, "An error occurred while fetching analytics data")
      setError(errorMessage)
      setShowErrorToastState(true)
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    onPeriodChange?.(period)
    
    // Fetch new data for the selected period
    await fetchAnalyticsData(period)
  }

  const handleCloseErrorToast = () => {
    setShowErrorToastState(false)
    setError(null)
  }

  const chartConfig = {
    clicks: {
      label: "Clicks",
      color: "#6449FF",
    },
  }

  return (
    <>
      <Card 
        className="w-full max-w-4xl mx-auto" 
        style={{ 
          backgroundColor: '#090909', 
          borderColor: '#2E2E2E',
          borderWidth: '1px'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-white text-lg font-medium">Total clicks:</span>
            <span className="text-white text-lg font-bold">
              {loading || initialLoading ? '...' : totalClicks.toLocaleString()}
            </span>
          </div>
          <div className="flex space-x-1">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePeriodChange(period.value)}
                disabled={loading}
                className={`px-3 py-1 text-sm ${
                  selectedPeriod === period.value
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }}
              >
                <defs>
                  <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6449FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6449FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#1A1A1A"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#747474', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#747474', fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black border border-gray-600 rounded-lg p-3 shadow-lg">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-0.5 h-8 bg-white"
                            />
                            <div>
                              <p className="text-white text-sm font-medium">
                                {payload[0].value?.toLocaleString()} clicks
                              </p>
                              <p className="text-gray-400 text-xs">{label}</p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{ stroke: 'white', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#6449FF"
                  strokeWidth={2}
                  fill="url(#clicksGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: "#6449FF",
                    stroke: "white",
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {showErrorToastState && error && (
        <Toast
          type="error"
          title="Chart Error"
          description={error}
          onClose={handleCloseErrorToast}
        />
      )}
    </>
  )
}
