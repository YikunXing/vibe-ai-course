import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnalytics } from '@/lib/supabase/helpers'
import { Analytics } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error in analytics API:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1m'

    // Get all analytics records for the user's links
    const userAnalytics = await getAnalytics({ userId: user.id }) as Analytics[]
    
    if (!userAnalytics) {
      console.error('Failed to fetch analytics for user:', user.id)
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
    }
    
    // Calculate total clicks
    const totalClicks = userAnalytics.length

    // Process analytics data for the chart based on period
    const processAnalyticsForChart = (period: string) => {
      const now = new Date()
      const dataPoints = {
        '1d': 24, // 24 hours
        '1w': 7,  // 7 days
        '1m': 30, // 30 days
        '6m': 26, // 26 weeks
        '1y': 12  // 12 months
      }

      const points = dataPoints[period as keyof typeof dataPoints] || 30
      const data = []
      
      for (let i = 0; i < points; i++) {
        let label = ''
        let clicks = 0
        
        switch (period) {
          case '1d':
            label = `${i}:00`
            // Count clicks for this hour
            const hourStart = new Date(now)
            hourStart.setHours(i, 0, 0, 0)
            const hourEnd = new Date(hourStart)
            hourEnd.setHours(i, 59, 59, 999)
            clicks = userAnalytics.filter(record => {
              const clickTime = new Date(record.clicked_at)
              return clickTime >= hourStart && clickTime <= hourEnd
            }).length
            break
          case '1w':
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            label = days[i] || `Day ${i + 1}`
            // Count clicks for this day
            const dayStart = new Date(now)
            dayStart.setDate(now.getDate() - (6 - i))
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)
            clicks = userAnalytics.filter(record => {
              const clickTime = new Date(record.clicked_at)
              return clickTime >= dayStart && clickTime <= dayEnd
            }).length
            break
          case '1m':
            label = `${i + 1}`
            // Count clicks for this day
            const monthDayStart = new Date(now)
            monthDayStart.setDate(i + 1)
            monthDayStart.setHours(0, 0, 0, 0)
            const monthDayEnd = new Date(monthDayStart)
            monthDayEnd.setHours(23, 59, 59, 999)
            clicks = userAnalytics.filter(record => {
              const clickTime = new Date(record.clicked_at)
              return clickTime >= monthDayStart && clickTime <= monthDayEnd
            }).length
            break
          case '6m':
            label = `W${i + 1}`
            // Count clicks for this week
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - (25 - i) * 7)
            weekStart.setHours(0, 0, 0, 0)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            clicks = userAnalytics.filter(record => {
              const clickTime = new Date(record.clicked_at)
              return clickTime >= weekStart && clickTime <= weekEnd
            }).length
            break
          case '1y':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            label = months[i] || `M${i + 1}`
            // Count clicks for this month
            const monthStart = new Date(now)
            monthStart.setMonth(i)
            monthStart.setDate(1)
            monthStart.setHours(0, 0, 0, 0)
            const monthEnd = new Date(monthStart)
            monthEnd.setMonth(monthStart.getMonth() + 1)
            monthEnd.setDate(0)
            monthEnd.setHours(23, 59, 59, 999)
            clicks = userAnalytics.filter(record => {
              const clickTime = new Date(record.clicked_at)
              return clickTime >= monthStart && clickTime <= monthEnd
            }).length
            break
          default:
            label = `${i + 1}`
            clicks = 0
        }
        
        data.push({
          period: label,
          clicks: clicks
        })
      }
      
      return data
    }

    const chartData = processAnalyticsForChart(period)

    return NextResponse.json({
      data: chartData,
      totalClicks,
      period
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
