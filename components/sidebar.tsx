"use client"
import { useState, useEffect } from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,

  } from "@/components/ui/sidebar"
  import {
    Home,
    BarChart3,
    Users,
    Handshake,
    CreditCard,
    Settings,
    HelpCircle,
    ExternalLink,
    LogOut,
    ChevronDown,
  } from "lucide-react"

  
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { useAuth } from "@/hooks/use-auth"
  import { createClient } from "@/lib/supabase/client"
  import { User as UserType } from "@/lib/supabase/types"
  import Link from "next/link"
  import { useRouter } from "next/navigation"
  import Toast from "./toast-notification"
  import { showErrorToast } from "@/lib/utils"

function AppSidebar() {
    const { user } = useAuth()
    const [userData, setUserData] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.id) {
                try {
                    // First try to get user data from the database
                    const supabase = createClient()
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (error) {
                        console.log('Database fetch failed, using auth metadata:', error.message)
                        // If database fetch fails, use auth user metadata as fallback
                        setUserData({
                            id: user.id,
                            created_at: user.created_at || new Date().toISOString(),
                            name: user.user_metadata?.display_name || user.user_metadata?.name || user.user_metadata?.full_name,
                            email: user.email
                        })
                    } else {
                        console.log('Successfully fetched user data from database:', data)
                        setUserData(data)
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                    const errorMessage = showErrorToast(error, 'Failed to fetch user data')
                    // Fallback to auth user metadata
                    setUserData({
                        id: user.id,
                        created_at: user.created_at || new Date().toISOString(),
                        name: user.user_metadata?.display_name || user.user_metadata?.name || user.user_metadata?.full_name,
                        email: user.email
                    })
                } finally {
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [user?.id, user?.created_at, user?.email, user?.user_metadata])

    // Get initials from user's name or fallback to email
    const getInitials = () => {
        if (userData?.name) {
            const nameParts = userData.name.trim().split(' ')
            if (nameParts.length >= 2) {
                return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            }
            return userData.name.substring(0, 2).toUpperCase()
        }
        if (userData?.email) {
            return userData.email.substring(0, 2).toUpperCase()
        }
        return 'U'
    }

    const handleLogout = async () => {
        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/auth')
        } catch (error) {
            console.error('Error logging out:', error)
            const errorMessage = showErrorToast(error, 'Failed to log out')
            // Note: We don't show a toast here as the user is being redirected
        }
    }

    return (
      <Sidebar className="border-r border-gray-800" style={{ backgroundColor: "#101011" }}>
        <SidebarHeader className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-white hover:text-white hover:bg-gray-800 p-0 h-auto"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{getInitials()}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    {loading ? (
                      <>
                        <div className="h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white truncate">
                          {userData?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {userData?.email || 'No email'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 bg-gray-900 border-gray-700 text-white"
              align="start"
              sideOffset={8}
            >
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-gray-800 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="mt-3">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
              <ExternalLink className="h-4 w-4 mr-2" />
              Link integrations
            </Button>
          </div>
        </SidebarHeader>
  
        <SidebarSeparator className="bg-gray-800" />
  
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <Link href="/" className="text-white">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/analytics" className="text-gray-300 hover:text-white">
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#" className="text-gray-300 hover:text-white">
                      <Users className="h-4 w-4" />
                      <span>Customers</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
  
          <SidebarSeparator className="bg-gray-800" />
  
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#" className="text-gray-300 hover:text-white">
                      <Handshake className="h-4 w-4" />
                      <span>Partners</span>
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs"
                        style={{ backgroundColor: "#1c2b1c", color: "#04C40A" }}
                      >
                        new
                      </Badge>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#" className="text-gray-300 hover:text-white">
                      <CreditCard className="h-4 w-4" />
                      <span>Payouts</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="text-gray-300 hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="text-gray-300 hover:text-white">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help centre</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    )
  }

export default AppSidebar;