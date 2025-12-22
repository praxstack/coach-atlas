/**
 * SidebarLayout - Responsive Layout with Sidebar
 * Desktop: Fixed sidebar on left
 * Mobile: Hamburger menu + Sheet
 */
import { Sidebar } from "@/features/sidebar/Sidebar";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

export function SidebarLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isMobile) {
    // Mobile: Collapsible Sheet
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header with Hamburger */}
        <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Coach Atlas</span>
        </div>

        {/* Content with top padding for header */}
        <div className="pt-14 min-h-screen">
          <Outlet />
        </div>
      </div>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div className="min-h-screen bg-background flex">
      {/* Fixed Sidebar */}
      <div className="w-[260px] h-screen fixed left-0 top-0 z-40">
        <Sidebar />
      </div>

      {/* Main Content - offset by sidebar width */}
      <div className="flex-1 ml-[260px] min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}

export default SidebarLayout;
