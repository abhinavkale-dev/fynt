"use client";
import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, } from "@/components/ui/sidebar";
type IconComponent = React.ComponentType<{
    className?: string;
}>;
export function NavMain({ items, label = "Platform", }: {
    items: {
        title: string;
        url: string;
        icon: IconComponent;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
    label?: string;
}) {
    return (<SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (<Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="h-9 data-[active=true]:bg-white/10">
                <Link href={item.url as Route} prefetch className="flex items-center gap-2.5 group">
                  <item.icon className="size-4 text-white/50 group-hover/menu-item:text-white group-data-[active=true]:text-white transition-colors duration-150 ease"/>
                  <span className="text-sm text-white/50 group-hover/menu-item:text-white group-data-[active=true]:text-white transition-colors duration-150 ease">{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (<>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (<SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url as Route} prefetch>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>) : null}
            </SidebarMenuItem>
          </Collapsible>))}
      </SidebarMenu>
    </SidebarGroup>);
}
