import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  ListTodo, 
  BarChart3, 
  Heart, 
  Settings 
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Replit Agent Chat" },
  { href: "/agents", icon: Users, label: "Agent Pools" },
  { href: "/tasks", icon: ListTodo, label: "Task Queue" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/health", icon: Heart, label: "Health Monitor" },
  { href: "/settings", icon: Settings, label: "Configuration" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="px-4 space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive 
                ? "bg-primary/10 text-primary border-r-2 border-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}>
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
