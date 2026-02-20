"use client";
import { SidebarInset, SidebarProvider, SidebarTrigger, } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { ReducedMotionProvider } from "@/components/providers/ReducedMotionProvider";
export default function Layout({ children }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isWorkflowEditor = pathname?.includes('/workflows/') && pathname !== '/home/workflows';
    return (<ReducedMotionProvider>
    <div className={`dashboard ${isWorkflowEditor ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className={isWorkflowEditor ? 'flex flex-col overflow-hidden' : ''}>
          {!isWorkflowEditor && (<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors duration-150 ease"/>
              <Separator orientation="vertical" className="mr-2 h-4"/>
              <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
            </header>)}
          <div className={isWorkflowEditor ? "flex flex-1 flex-col overflow-hidden" : "flex flex-1 flex-col gap-4 p-4"}>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
    </ReducedMotionProvider>);
}
