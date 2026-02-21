"use client";
import * as React from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { NavMain } from "@/components/layout/navigation/nav-main";
import { NavSecondary } from "@/components/layout/navigation/nav-secondary";
import { NavUser } from "@/components/layout/navigation/nav-user";
import { WorkflowsIcon, CredentialsIcon, ExecutionsIcon, TemplatesIcon, UpgradeIcon, } from "@/components/icons";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@/components/ui/sidebar";
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    React.useEffect(() => {
        const dashboardRoutes = [
            "/home",
            "/home/templates",
            "/home/credentials",
            "/home/executions",
        ] as const;
        dashboardRoutes.forEach((route) => router.prefetch(route));
    }, [router]);
    const navData = {
        navMainPlatform: [
            {
                title: "Workflows",
                url: "/home",
                icon: WorkflowsIcon,
                isActive: pathname === "/home" || pathname?.startsWith("/home/workflows"),
            },
            {
                title: "Credentials",
                url: "/home/credentials",
                icon: CredentialsIcon,
                isActive: pathname?.startsWith("/home/credentials"),
            },
        ],
        navMainOther: [
            {
                title: "Executions",
                url: "/home/executions",
                icon: ExecutionsIcon,
                isActive: pathname?.startsWith("/home/executions"),
            },
            {
                title: "Templates",
                url: "/home/templates",
                icon: TemplatesIcon,
                isActive: pathname?.startsWith("/home/templates"),
            },
        ],
        navSecondary: [
            {
                title: "Upgrade to Pro",
                url: "/home/upgrade",
                icon: UpgradeIcon,
                inert: true,
                isActive: pathname?.startsWith("/home/upgrade"),
            },
        ],
    };
    const user = session?.user
        ? {
            name: session.user.name || "User",
            email: session.user.email || "",
            avatar: session.user.image || "",
        }
        : {
            name: "Guest",
            email: "guest@example.com",
            avatar: "",
        };
    return (<Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="flex aspect-square size-8 items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 65 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" fill="#D97757"/>
              <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" fill="#F04D26"/>
              <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" fill="#D97757"/>
              <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" fill="#F04D26"/>
              <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" fill="#D97757"/>
              <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" fill="#F04D26"/>
              <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" stroke="white"/>
              <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" stroke="white"/>
              <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" stroke="white"/>
            </svg>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Fynt</span>
            <span className="truncate text-xs text-muted-foreground">Workflow Automation</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMainPlatform} label="Platform"/>
        <NavMain items={navData.navMainOther} label="Resources"/>
        <div className="mt-auto">
          <SidebarGroup className="pb-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-9">
                    <a target="_blank" rel="noreferrer noopener" href="https://github.com/abhinavkale-dev/fynt" className="flex items-center gap-2.5 group">
                      <svg height="14" width="14" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0 text-white/50 group-hover/menu-item:text-white transition-colors duration-150 ease">
                        <g fill="currentColor">
                          <path d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z"/>
                        </g>
                      </svg>
                      <span className="text-sm text-white/50 group-hover/menu-item:text-white transition-colors duration-150 ease">Proudly Open Source</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        <NavSecondary items={navData.navSecondary} className="pt-0"/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user}/>
      </SidebarFooter>
    </Sidebar>);
}
