"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  ChevronDown,
  Plus,
  Search,
  Copy,
  Mouse,
  Filter,
  MoreHorizontal,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import AppSidebar from "./sidebar"
import { LinkModal } from "./link-modal"
import { useLinks, Link as UILink } from "@/hooks/use-links"
import { useAuth } from "@/hooks/use-auth"
import Toast from "./toast-notification"
import { createLink } from "@/lib/supabase/helpers"
import { Link as DatabaseLink } from "@/lib/supabase/types"
import { Skeleton } from "@/components/ui/skeleton"
import { recordLinkClick } from "@/lib/supabase/helpers"
import { showErrorToast } from "@/lib/utils"

const LinkCard = React.memo(({ link }: { link: UILink }) => {
  const router = useRouter()
  
  const handleTestClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await recordLinkClick(link.id)
    } catch (error) {
      console.error('Error recording test click:', error)
    }
  }, [link.id])
  
  const handleCardClick = useCallback(() => {
    router.push(`/link/${link.id}`)
  }, [router, link.id])
  
  const handleCopyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])
  
  return (
    <Card
      className="p-4 border hover:bg-gray-800/10 transition-colors cursor-pointer"
      style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Image src={link.favicon || "/placeholder.svg"} alt="Favicon" width={24} height={24} className="rounded" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 font-medium text-sm">{link.shortUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={handleCopyClick}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <span className="truncate">{link.originalUrl}</span>
            <span>•</span>
            <span>{link.createdAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Mouse className="h-4 w-4 text-gray-400" />
          <span className="text-white font-medium">{link.clicks.toLocaleString()}</span>
          <div className={`h-2 w-2 rounded-full ${link.isActive ? "bg-green-500" : "bg-gray-500"}`} />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={handleTestClick}
            title="Test click (for realtime demo)"
          >
            <Mouse className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
})

LinkCard.displayName = 'LinkCard'

const LinkSkeleton = React.memo(() => {
  return (
    <Card className="p-4 border" style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    </Card>
  )
})

LinkSkeleton.displayName = 'LinkSkeleton'

export function LinkDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    type: 'success' | 'error'
    title: string
    description: string
  }>({
    show: false,
    type: 'success',
    title: '',
    description: ''
  })
  const { links, fetchUserLinks, forceRefreshLinks, isLoading, isConnecting, hasInitialized, error, isRealtimeConnected } = useLinks()
  const { user, loading: authLoading } = useAuth()

  // Fetch user links when component mounts and user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchUserLinks(user.id)
    }
  }, [user, authLoading, fetchUserLinks])

  const handleCreateLink = useCallback(async (newLinkData: {
    destinationUrl: string
    shortUrl: string
    description: string
    tags?: string
  }) => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated. Please log in to create links.")
      }

      // Extract short code from the full short URL (remove domain)
      const shortCode = newLinkData.shortUrl.split('/').pop() || newLinkData.shortUrl
      
      // Create link data for database
      const linkData: Omit<DatabaseLink, 'id' | 'created_at'> = {
        user_id: user.id,
        description: newLinkData.description || "Untitled Link",
        destination_url: newLinkData.destinationUrl,
        slug: shortCode,
        conversion_tracking: true,
        tags: newLinkData.tags ? newLinkData.tags.split(',').map(tag => tag.trim()) : [],
        folder: "links"
      }
      
      // Send to database
      const createdLink = await createLink(linkData)
      
      if (!createdLink) {
        throw new Error("Failed to create link in database")
      }
      
      // Refresh the links list to show the newly created link
      await forceRefreshLinks(user.id)
      setIsModalOpen(false)
      
      // Show success toast
      setToast({
        show: true,
        type: 'success',
        title: 'Link Created Successfully',
        description: `Your short link ${newLinkData.shortUrl} has been created and is ready to use.`
      })
          } catch (error) {
        console.error('Error creating link:', error)
        const errorMessage = showErrorToast(error, 'There was an error creating your link. Please try again.')
        // Show error toast
        setToast({
          show: true,
          type: 'error',
          title: 'Failed to Create Link',
          description: errorMessage
        })
      }
  }, [user?.id, forceRefreshLinks])

  const handleModalError = useCallback((error: string) => {
    setToast({
      show: true,
      type: 'error',
      title: 'Validation Error',
      description: error
    })
  }, [])

  const handleCloseToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }))
  }, [])

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open)
  }, [])

  const handleRetryClick = useCallback(() => {
    if (user?.id) {
      fetchUserLinks(user.id)
    }
  }, [user?.id, fetchUserLinks])

  // Memoize expensive calculations
  const skeletonArray = useMemo(() => [...Array(3)], [])
  
  const dropdownMenuContent = useMemo(() => (
    <DropdownMenuContent className="bg-gray-900 border-gray-800">
      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
        All Links
      </DropdownMenuItem>
      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
        Active Links
      </DropdownMenuItem>
      <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800">
        Inactive Links
      </DropdownMenuItem>
    </DropdownMenuContent>
  ), [])

  const featureButtons = useMemo(() => (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
      >
        <Filter className="h-4 w-4 mr-2" />
        Display
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
      >
        <MoreHorizontal className="h-4 w-4 mr-2" />
        Bulk actions
      </Button>
    </>
  ), [])

  const statusIndicator = useMemo(() => (
    <div className="flex items-center gap-2 ml-4">
      <div className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
      <span className="text-xs text-gray-400">
        {isRealtimeConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  ), [isRealtimeConnected])

  return (
    <div className="min-h-screen text-white bg-[#090909]">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 px-6">
            <SidebarTrigger className="-ml-1 text-gray-400 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-800" />

            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Links</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                {dropdownMenuContent}
              </DropdownMenu>
            </div>

            <div className="ml-auto">
              <Button 
                className="text-white hover:bg-gray-700" 
                style={{ backgroundColor: "#1F1F1F" }}
                onClick={() => setIsModalOpen(true)}
                disabled={!user}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create link
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-6">
            <Separator className="bg-gray-800" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {featureButtons}
                {statusIndicator}
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search links..."
                  className="pl-10 border text-white placeholder-gray-400 focus:border-blue-500"
                  style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {authLoading ? (
                <div className="space-y-3">
                  {skeletonArray.map((_, i) => (
                    <LinkSkeleton key={i} />
                  ))}
                </div>
              ) : !user ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">Authentication required</div>
                    <div className="text-gray-500 text-sm">Please log in to view your links</div>
                  </div>
                </div>
              ) : !hasInitialized ? (
                <div className="space-y-3">
                  {isConnecting ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">Connecting to database...</div>
                        <div className="text-gray-500 text-sm">Please wait while we establish a connection</div>
                      </div>
                    </div>
                  ) : (
                    skeletonArray.map((_, i) => (
                      <LinkSkeleton key={i} />
                    ))
                  )}
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-red-400 mb-2">Error loading links</div>
                    <div className="text-gray-500 text-sm mb-4">{error}</div>
                    <Button 
                      onClick={handleRetryClick}
                      className="text-white hover:bg-gray-700"
                      style={{ backgroundColor: "#1F1F1F" }}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {skeletonArray.map((_, i) => (
                    <LinkSkeleton key={i} />
                  ))}
                </div>
              ) : links.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">No links yet</div>
                    <div className="text-gray-500 text-sm">Create your first link to get started</div>
                  </div>
                </div>
              ) : (
                links.map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
      <LinkModal isOpen={isModalOpen} onOpenChange={handleModalOpenChange} onCreateLink={handleCreateLink} onError={handleModalError} />
      
      {toast.show && (
        <Toast 
          type={toast.type} 
          title={toast.title} 
          description={toast.description} 
          onClose={handleCloseToast} 
        />
      )}
    </div>
  )
}
