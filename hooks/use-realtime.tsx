"use client"
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  userId: string
  onAnalyticsUpdate?: (linkId: string, newClickCount: number) => void
  onError?: (error: Error) => void
}

export function useRealtime({ userId, onAnalyticsUpdate, onError }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const linkIdsRef = useRef<string[]>([])
  const supabase = createClient()

  const subscribeToAnalytics = useCallback(() => {
    if (!userId) return

    try {
      // Subscribe to INSERT events on the analytics table
      // Since we can't filter by link_id dynamically in the subscription,
      // we'll subscribe to all analytics changes and filter in the callback
      channelRef.current = supabase
        .channel(`analytics-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics'
          },
          (payload) => {
            try {
              console.log('Realtime analytics update:', payload)
              if (payload.new && onAnalyticsUpdate) {
                const { link_id } = payload.new
                // Only process if this link belongs to the current user
                if (linkIdsRef.current.includes(link_id)) {
                  onAnalyticsUpdate(link_id, 1) // Increment by 1 for new click
                }
              }
            } catch (error) {
              console.error('Error processing realtime analytics update:', error)
              onError?.(new Error(`Failed to process analytics update: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'analytics'
          },
          (payload) => {
            try {
              console.log('Realtime analytics delete:', payload)
              if (payload.old && onAnalyticsUpdate) {
                const { link_id } = payload.old
                // Only process if this link belongs to the current user
                if (linkIdsRef.current.includes(link_id)) {
                  onAnalyticsUpdate(link_id, -1) // Decrement by 1 for deleted click
                }
              }
            } catch (error) {
              console.error('Error processing realtime analytics delete:', error)
              onError?.(new Error(`Failed to process analytics delete: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'CHANNEL_ERROR') {
            const error = new Error('Realtime channel error occurred')
            console.error('Realtime channel error:', error)
            onError?.(error)
          }
        })
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
      onError?.(new Error(`Failed to set up realtime subscription: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  }, [userId, onAnalyticsUpdate, onError, supabase])

  const unsubscribeFromAnalytics = useCallback(() => {
    if (channelRef.current) {
      console.log('Unsubscribing from analytics realtime updates')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [supabase])

  const updateLinkIds = useCallback((linkIds: string[]) => {
    // Update the stored link IDs for filtering
    linkIdsRef.current = linkIds
    console.log('Updated link IDs for realtime filtering:', linkIds)
  }, [])

  useEffect(() => {
    if (userId) {
      subscribeToAnalytics()
    }

    return () => {
      unsubscribeFromAnalytics()
    }
  }, [userId, subscribeToAnalytics, unsubscribeFromAnalytics])

  return {
    updateLinkIds,
    isSubscribed: !!channelRef.current
  }
}


