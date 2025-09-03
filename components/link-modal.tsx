"use client"

import React, { useState, useMemo, useCallback } from "react"
import { HelpCircle, RefreshCw, Tag, Folder, Zap, Target, Calendar, Lock, Plus } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface LinkModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateLink: (newLinkData: {
    destinationUrl: string
    shortUrl: string
    description: string
    tags?: string
  }) => Promise<void>
  onError?: (error: string) => void
}

export const LinkModal = React.memo(({ isOpen, onOpenChange, onCreateLink, onError }: LinkModalProps) => {
  const [conversionTracking, setConversionTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    destinationUrl: "",
    shortUrl: "pOg8x1e",
    shortUrlDomain: "links.sh",
    tags: "",
    description: "",
    folder: "links"
  })

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const generateRandomShortUrl = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }, [])

  const handleCreateLink = useCallback(async () => {
    try {
      // Validate required fields
      if (!formData.destinationUrl.trim()) {
        onError?.("Please enter a destination URL")
        return
      }
      
      if (!formData.shortUrl.trim()) {
        onError?.("Please enter a short URL")
        return
      }

      setIsLoading(true)
      const fullShortUrl = `${formData.shortUrlDomain}/${formData.shortUrl}`
      
      await onCreateLink({
        destinationUrl: formData.destinationUrl,
        shortUrl: fullShortUrl,
        description: formData.description,
        tags: formData.tags
      })

      // Reset form
      setFormData({
        destinationUrl: "",
        shortUrl: generateRandomShortUrl(),
        shortUrlDomain: "links.sh",
        tags: "",
        description: "",
        folder: "links"
      })
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [formData, onCreateLink, onError, generateRandomShortUrl])

  const handleRefreshClick = useCallback(() => {
    handleInputChange("shortUrl", generateRandomShortUrl())
  }, [handleInputChange, generateRandomShortUrl])

  const handleCloseClick = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Memoize static content and expensive calculations
  const featureChips = useMemo(() => (
    <div className="flex gap-2 flex-wrap">
      <Badge variant="secondary" className="flex items-center gap-1 bg-[#1F1F1F] text-white border-[#333333]">
        <Zap className="h-3 w-3" />
        UTM
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1 bg-[#1F1F1F] text-white border-[#333333]">
        <Target className="h-3 w-3" />
        Targeting
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1 bg-[#1F1F1F] text-white border-[#333333]">
        <Calendar className="h-3 w-3" />
        Expiration
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1 bg-[#1F1F1F] text-white border-[#333333]">
        <Lock className="h-3 w-3" />
        Password
      </Badge>
    </div>
  ), [])

  const domainSelectContent = useMemo(() => (
    <SelectContent className="bg-[#101011] border-[#333333]">
      <SelectItem value="links.sh" className="text-white focus:bg-[#1F1F1F]">links.sh</SelectItem>
      <SelectItem value="localhost:3000" className="text-white focus:bg-[#1F1F1F]">localhost:3000</SelectItem>
    </SelectContent>
  ), [])

  const folderSelectContent = useMemo(() => (
    <SelectContent className="bg-[#101011] border-[#333333]">
      <SelectItem value="links" className="text-white focus:bg-[#1F1F1F]">
        <div className="flex items-center gap-2">
          Links
        </div>
      </SelectItem>
    </SelectContent>
  ), [])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 bg-[#101011] border-[#333333]">
        <div className="flex">
          {/* Left Column */}
          <div className="flex-1 p-6 space-y-6">
            {/* Breadcrumbs */}
            <div className="text-sm text-[#BCBCBC]">
              Links {'>'} New Link
            </div>

            {/* Destination URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="destination" className="text-white">Destination URL</Label>
                <HelpCircle className="h-4 w-4 text-[#BCBCBC]" />
              </div>
              <Input
                id="destination"
                placeholder="https://example.com/subdomain-here"
                className="w-full bg-transparent border-[#333333] text-white placeholder:text-[#BCBCBC]"
                value={formData.destinationUrl}
                onChange={(e) => handleInputChange("destinationUrl", e.target.value)}
              />
            </div>

            {/* Short Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="shortlink" className="text-white">Short Link</Label>
                <RefreshCw 
                  className="h-4 w-4 text-[#BCBCBC] ml-auto cursor-pointer hover:text-white" 
                  onClick={handleRefreshClick}
                />
              </div>
              <div className="flex">
                <Select value={formData.shortUrlDomain} onValueChange={(value) => handleInputChange("shortUrlDomain", value)}>
                  <SelectTrigger className="w-32 rounded-r-none border-r-0 bg-transparent border-[#333333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  {domainSelectContent}
                </Select>
                <Input
                  value={formData.shortUrl}
                  onChange={(e) => handleInputChange("shortUrl", e.target.value)}
                  className="flex-1 rounded-l-none bg-transparent border-[#333333] text-white"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tags" className="text-white">Tags</Label>
                <HelpCircle className="h-4 w-4 text-[#BCBCBC]" />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#BCBCBC]" />
                <Input
                  id="tags"
                  placeholder="Select tags"
                  className="pl-10 bg-transparent border-[#333333] text-white placeholder:text-[#BCBCBC]"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                />
              </div>
            </div>

            {/* Conversion Tracking */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="conversion" className="text-white">Conversion Tracking</Label>
                <HelpCircle className="h-4 w-4 text-[#BCBCBC]" />
              </div>
              <Switch
                id="conversion"
                checked={conversionTracking}
                onCheckedChange={setConversionTracking}
              />
            </div>

            {/* Line Divider */}
            <div className="border-t border-[#333333]" />

            {/* Feature Chips */}
            {featureChips}
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-[#333333]" />

          {/* Right Column */}
          <div className="flex-1 p-6 space-y-6 relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-6 w-6"
              onClick={handleCloseClick}
            >
            </Button>

            {/* Folder */}
            <div className="space-y-2 mt-8">
              <div className="flex items-center gap-2">
                <Label htmlFor="folder" className="text-white">Folder</Label>
                <HelpCircle className="h-4 w-4 text-[#BCBCBC]" />
              </div>
              <Select value={formData.folder} onValueChange={(value) => handleInputChange("folder", value)}>
                <SelectTrigger className="bg-[#1C2B1C] border-[#04C40A] text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: '#1c2b1c' }}>
                      <Folder className="h-3 w-3" style={{ color: '#04C40A' }} />
                    </div>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                {folderSelectContent}
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a short description here…"
                className="min-h-[100px] resize-none bg-transparent border-[#333333] text-white placeholder:text-[#BCBCBC]"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            {/* Line Divider */}
            <div className="border-t border-[#333333]" />

            {/* Create Link Button */}
            <Button className="w-full" onClick={handleCreateLink} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

LinkModal.displayName = 'LinkModal'

// Keep the original component for backward compatibility
export default function Component() {
  const [isOpen, setIsOpen] = useState(false)

  const handleCreateLink = useCallback(async (newLinkData: {
    destinationUrl: string
    shortUrl: string
    description: string
    tags?: string
  }) => {
    console.log("New link created:", newLinkData)
  }, [])

  const handleError = useCallback((error: string) => {
    console.error("Modal error:", error)
  }, [])

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>Open Link Modal</Button>
      <LinkModal isOpen={isOpen} onOpenChange={setIsOpen} onCreateLink={handleCreateLink} onError={handleError} />
    </div>
  )
}
