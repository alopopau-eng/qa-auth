import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@assets/generated_images/logo_for_tawtheeq_national_authentication_system.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin/dashboard" },
    { icon: Inbox, label: "Inbox", path: "/admin/inbox", badge: "5" },
    { icon: Users, label: "Visitors", path: "/admin/visitors" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans overflow-hidden" dir="ltr">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0f172a] text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl",
          isSidebarOpen ? "translate-x-0 w-64" : isMobile ? "-translate-x-full w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-800 justify-between">
          <div className="flex items-center">
             <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
             {(isSidebarOpen || isMobile) && (
               <span className="ml-3 font-bold text-lg tracking-tight">Tawtheeq</span>
             )}
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors group relative",
                  location === item.path 
                    ? "bg-[#1e293b] text-blue-400" 
                    : "text-gray-400 hover:bg-[#1e293b] hover:text-white"
                )}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(isSidebarOpen || isMobile) && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
                {(isSidebarOpen || isMobile) && item.badge && (
                  <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {!isSidebarOpen && !isMobile && item.badge && (
                   <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full" />
                )}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/admin/login">
            <a className={cn(
              "flex items-center px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors",
              !isSidebarOpen && !isMobile && "justify-center"
            )}>
              <LogOut className="h-5 w-5" />
              {(isSidebarOpen || isMobile) && <span className="ml-3 font-medium">Logout</span>}
            </a>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen w-full",
          !isMobile && (isSidebarOpen ? "ml-64" : "ml-20")
        )}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Mobile Search Toggle could go here */}
            <div className="relative hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
             {/* Mobile Search Icon */}
             <button className="md:hidden p-2 text-gray-600">
                <Search className="h-5 w-5" />
             </button>

            <button className="relative p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
