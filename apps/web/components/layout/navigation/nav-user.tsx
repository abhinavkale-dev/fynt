"use client";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem, } from "@/components/ui/sidebar";
function getInitials(name: string): string {
    if (!name)
        return "U";
    const words = name.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0)
        return "U";
    if (words.length === 1) {
        const firstWord = words[0];
        return firstWord ? firstWord.substring(0, 2).toUpperCase() : "U";
    }
    const firstInitial = words[0]?.[0] || "";
    const lastInitial = words[words.length - 1]?.[0] || "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
}
export function NavUser({ user, }: {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
}) {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const initials = getInitials(user.name);
    if (isSigningOut) {
        return null;
    }
    return (<SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-2 px-2 py-2 group/user-info cursor-pointer">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.name}/>
            <AvatarFallback className="rounded-lg text-xs bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight overflow-hidden">
            <span className="truncate text-sm font-medium text-white/50 group-hover/user-info:text-white transition-colors duration-150 ease">{user.name}</span>
            <span className="truncate text-xs text-white/40 group-hover/user-info:text-white/60 transition-colors duration-150 ease">{user.email}</span>
          </div>
          <button className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors shrink-0" onClick={async () => {
            setIsSigningOut(true);
            try {
                await signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            window.location.href = '/';
                        }
                    }
                });
            }
            catch (error) {
                console.error('Sign-out error:', error);
                window.location.href = '/';
            }
        }} title="Logout">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 group-hover/user-info:text-white transition-colors">
              <path opacity="0.4" d="M26.2214 29.3337H14.6658C12.9506 29.3337 11.5547 27.9377 11.5547 26.2225V5.7781C11.5547 4.0629 12.9506 2.66699 14.6658 2.66699H26.2214C27.9366 2.66699 29.3325 4.0629 29.3325 5.7781V26.2225C29.3325 27.9377 27.9366 29.3337 26.2214 29.3337Z" fill="currentColor"/>
              <path d="M19.5547 9.87893V22.1219C19.5547 23.2044 20.1033 24.1923 21.0251 24.766L27.7325 28.925C28.6829 28.392 29.3341 27.3868 29.3341 26.2218V5.77742C29.3341 4.61333 28.6834 3.60817 27.7339 3.0752L21.0251 7.23411C20.1049 7.80531 19.5547 8.79377 19.5547 9.87893Z" fill="currentColor"/>
              <path d="M12.9422 15.0579L8.05333 10.169C7.53244 9.6481 6.68798 9.6481 6.16709 10.169C5.6462 10.6899 5.6462 11.5343 6.16709 12.0552L8.78044 14.6685H1.33333C0.597333 14.6685 0 15.2659 0 16.0019C0 16.7379 0.597333 17.3352 1.33333 17.3352H8.78044L6.16709 19.9486C5.6462 20.4694 5.6462 21.3139 6.16709 21.8348C6.42665 22.0943 6.76798 22.2259 7.10932 22.2259C7.45065 22.2259 7.79198 22.0961 8.05154 21.8348L12.9404 16.9459C13.4613 16.425 13.4613 15.5805 12.9404 15.0597L12.9422 15.0579Z" fill="currentColor" className="transition-transform duration-200 group-hover/user-info:translate-x-0.5"/>
            </svg>
          </button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>);
}
