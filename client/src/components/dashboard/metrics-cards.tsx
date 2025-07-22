import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, CheckSquare, Heart, TrendingUp } from "lucide-react";

interface MetricsCardsProps {
  data?: any;
}

export function MetricsCards({ data }: MetricsCardsProps) {
  const metrics = data || {};
  const activeConversations = metrics.conversations?.active || 0;
  const agentPools = metrics.agentPools || [];
  const onlineAgentPools = agentPools.filter((pool: any) => pool.status === "online").length;
  const totalAgentPools = agentPools.length;
  const tasksProcessed = metrics.tasks?.total || 0;
  const systemHealth = metrics.metrics?.system_health || "99.8";

  const metricsCards = [
    {
      title: "Active Conversations",
      value: activeConversations.toString(),
      change: "+12% vs last hour",
      icon: MessageSquare,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: "up"
    },
    {
      title: "Agent Pools",
      value: `${onlineAgentPools}/${totalAgentPools}`,
      change: "All operational",
      icon: Users,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      trend: "stable"
    },
    {
      title: "Tasks Processed",
      value: tasksProcessed.toString(),
      change: "Today",
      icon: CheckSquare,
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      trend: "up"
    },
    {
      title: "System Health",
      value: `${systemHealth}%`,
      change: "Excellent",
      icon: Heart,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      trend: "stable"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsCards.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.trend === "up" && (
                      <TrendingUp className="text-success mr-1" size={12} />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.trend === "up" ? "text-success" : 
                      metric.trend === "stable" ? "text-success" : 
                      "text-muted-foreground"
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.iconBg}`}>
                  <Icon className={metric.iconColor} size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
