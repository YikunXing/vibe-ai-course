"use client"
import { useState, useEffect } from "react"
import {
  Copy,
  MoreHorizontal,
  FileQuestionIcon as QuestionIcon,
  RefreshCw,
  Tag,
  FolderOpen,
  Link,
  Target,
  Calendar,
  Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import AppSidebar from "./sidebar"
import { useLinks } from "@/hooks/use-links"
import { useRouter } from "next/navigation"
import Toast from "./toast-notification"
import { Link as DatabaseLink } from "@/lib/supabase/types"

interface LinkDetailProps {
  linkId: string
}

export function LinkDetail({ linkId }: LinkDetailProps) {
  const { getLinkById, updateLinkInDatabase } = useLinks()
  const router = useRouter()
  const link = getLinkById(linkId)

  // Local state for form inputs
  const [formData, setFormData] = useState({
    originalUrl: "",
    shortUrl: "",
    tags: "",
    conversionTracking: false,
    folder: "links",
    description: "",
  })

  // Toast state
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

  // Initialize form data when link is loaded
  useEffect(() => {
    if (link) {
      setFormData({
        originalUrl: link.originalUrl,
        shortUrl: link.shortUrl.split('/').pop() || "",
        tags: link.tags || "",
        conversionTracking: link.conversionTracking || false,
        folder: link.folder || "links",
        description: link.description,
      })
    }
  }, [link])

  const handleSave = async () => {
    if (link) {
      try {
        // Parse tags from comma-separated string to array, filtering out empty tags
        const tagsArray = formData.tags 
          ? formData.tags.split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
          : []
        
        // Map UI form data to database schema
        const databaseUpdates: Partial<DatabaseLink> = {
          destination_url: formData.originalUrl,
          slug: formData.shortUrl,
          tags: tagsArray,
          conversion_tracking: formData.conversionTracking,
          folder: formData.folder,
          description: formData.description,
        }
        
        // Update database
        const success = await updateLinkInDatabase(linkId, databaseUpdates)
        
        if (success) {
          // Update local state (this will be handled by updateLinkInDatabase)
          // Show success toast
          setToast({
            show: true,
            type: 'success',
            title: 'Link Updated Successfully',
            description: `Changes to ${formData.shortUrl} have been saved and will take effect immediately.`
          })

          // Navigate back to dashboard after showing the toast
          setTimeout(() => {
            router.push('/')
          }, 1800)
        } else {
          throw new Error('Failed to update link in database')
        }
      } catch (error) {
        // Show error toast
        setToast({
          show: true,
          type: 'error',
          title: 'Failed to Update Link',
          description: error instanceof Error ? error.message : 'There was an error updating your link. Please try again.'
        })
      }
    }
  }

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  if (!link) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: "#090909" }}>
        <div>Link not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#090909" }}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-800 px-6">
            <SidebarTrigger className="-ml-1 text-gray-400 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-gray-800" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-gray-400 hover:text-white">
                    Links
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-gray-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">{link.shortUrl}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 bg-transparent"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="mx-auto flex flex-1 flex-col gap-6 p-6 w-[600px]">
            {/* Destination URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Destination URL</label>
                <QuestionIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="https://example.com/subdomain-here"
                className="border text-white placeholder-gray-400 focus:border-blue-500"
                style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                value={formData.originalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
              />
            </div>

            {/* Short Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-white">Short Link</label>
                </div>
                <RefreshCw className="h-4 w-4 text-gray-400 cursor-pointer hover:text-white" />
              </div>
              <div className="flex">
                <Select value="localhost:3000" disabled>
                  <SelectTrigger
                    className="w-32 rounded-r-none border-r-0 text-white"
                    style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="localhost:3000" className="text-gray-300 hover:text-white">
                      localhost:3000
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={formData.shortUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortUrl: e.target.value }))}
                  className="rounded-l-none border text-white focus:border-blue-500"
                  style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Tags</label>
                <QuestionIcon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Select tags"
                  className="pl-10 border text-white placeholder-gray-400 focus:border-blue-500"
                  style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
            </div>

            {/* Conversion Tracking */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Conversion Tracking</label>
                <QuestionIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Switch 
                checked={formData.conversionTracking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, conversionTracking: checked }))}
              />
            </div>

            <Separator style={{ backgroundColor: "#2E2E2E" }} />

            {/* Folder */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white">Folder</label>
                <QuestionIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Select value={formData.folder} onValueChange={(value) => setFormData(prev => ({ ...prev, folder: value }))}>
                <SelectTrigger
                  className="border text-white"
                  style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: "#1c2b1c" }}
                    >
                      <FolderOpen className="h-3 w-3" style={{ color: "#04C40A" }} />
                    </div>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="links" className="text-gray-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#1c2b1c" }}
                      >
                        <FolderOpen className="h-3 w-3" style={{ color: "#04C40A" }} />
                      </div>
                      Links
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Description</label>
              <Textarea
                placeholder="Add a short description here…"
                className="border text-white placeholder-gray-400 focus:border-blue-500 resize-none"
                style={{ backgroundColor: "transparent", borderColor: "#2E2E2E" }}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Feature Chips */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800">
                <Link className="h-3 w-3 mr-1" />
                UTM
              </Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800">
                <Target className="h-3 w-3 mr-1" />
                Targeting
              </Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800">
                <Calendar className="h-3 w-3 mr-1" />
                Expiration
              </Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800">
                <Lock className="h-3 w-3 mr-1" />
                Password
              </Badge>
            </div>

            <Separator style={{ backgroundColor: "#2E2E2E" }} />

            {/* Created Info */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Created by adamsmith@gmail.com</span>
              <span>•</span>
              <span>March 15, 2024</span>
            </div>

            {/* Save Button */}
            <div className="flex justify-start">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      
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
