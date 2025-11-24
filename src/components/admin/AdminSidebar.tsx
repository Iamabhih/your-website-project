import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  Truck,
  MessageSquare,
  Users2,
  Radio,
  Megaphone,
  Smartphone,
  BarChart3,
  Settings,
  Upload,
  LogOut,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Commerce",
    icon: ShoppingCart,
    items: [
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Import Products", url: "/admin/products/import", icon: Upload },
      { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
      { title: "Abandoned Carts", url: "/admin/abandoned-carts", icon: ShoppingCart },
      { title: "Customers", url: "/admin/customers", icon: Users },
      { title: "Coupons", url: "/admin/coupons", icon: Ticket },
      { title: "Reviews", url: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Delivery",
    url: "/admin/delivery-options",
    icon: Truck,
  },
  {
    title: "Communication",
    icon: MessageSquare,
    items: [
      { title: "Telegram Chats", url: "/admin/telegram-chats", icon: MessageSquare },
      { title: "Telegram Support", url: "/admin/telegram-support", icon: MessageSquare },
      { title: "Telegram Customers", url: "/admin/telegram-customers", icon: Users2 },
      { title: "Broadcast Messages", url: "/admin/telegram-broadcast", icon: Radio },
    ],
  },
  {
    title: "Content",
    icon: Megaphone,
    items: [
      { title: "Banner Management", url: "/admin/banner", icon: Megaphone },
      { title: "PWA Settings", url: "/admin/pwa", icon: Smartphone },
    ],
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "System",
    icon: Activity,
    items: [
      { title: "System Logs", url: "/admin/system-logs", icon: Activity },
    ],
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        {menuItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.items ? (
              <>
                <SidebarGroupLabel>
                  <section.icon className="mr-2 h-4 w-4" />
                  {!isCollapsed && section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            className="hover:bg-muted/50"
                            activeClassName="bg-primary/10 text-primary font-medium"
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={section.url!}
                        end
                        className="hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <section.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{section.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="shrink-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
