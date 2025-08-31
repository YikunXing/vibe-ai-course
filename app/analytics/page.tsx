import AppSidebar from "@/components/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsFetcher from "@/components/analytics-fetcher"; // 👈 new client component

// Force dynamic rendering since we use server-side auth
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth");
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
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-gray-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">Analytics</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="mx-auto flex flex-1 flex-col gap-6 p-6 w-[1000px]">
            {/* 👇 Move actual analytics fetching to client */}
            <AnalyticsFetcher />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
