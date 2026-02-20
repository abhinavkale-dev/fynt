import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@/components/ui/sidebar";
type IconComponent = React.ComponentType<{
    className?: string;
}>;
export function NavSecondary({ items, ...props }: {
    items: {
        title: string;
        url: string;
        icon: IconComponent;
        inert?: boolean;
        isActive?: boolean;
    }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    return (<SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (<SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.isActive} className="h-9 data-[active=true]:bg-white/10">
                <Link href={item.url as Route} prefetch onClick={(event) => {
            if (!item.inert)
                return;
            event.preventDefault();
        }} className="flex items-center gap-2.5 group">
                  <item.icon className="size-4 text-white/50 group-hover/menu-item:text-white group-data-[active=true]:text-white transition-colors duration-150 ease"/>
                  <span className="text-sm text-white/50 group-hover/menu-item:text-white group-data-[active=true]:text-white transition-colors duration-150 ease">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>);
}
