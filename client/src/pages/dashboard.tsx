import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { ReplitInterface } from "@/components/dashboard/replit-interface";
import { AgentPools } from "@/components/dashboard/agent-pools";
import { TaskQueue } from "@/components/dashboard/task-queue";
import { SystemHealth } from "@/components/dashboard/system-health";
import { Bot, Users } from "lucide-react";

export default function Dashboard() {
  const { data: systemStatus, isLoading } = useQuery({
    queryKey: ["/api/system/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: healthData } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: activityData } = useQuery({
    queryKey: ["/api/activity"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OperatorOS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">OperatorOS</h1>
              <p className="text-xs text-muted-foreground">Enterprise AI Orchestration</p>
            </div>
          </div>
        </div>
        
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">System Dashboard</h2>
              <p className="text-muted-foreground text-sm">Enterprise AI Agent Orchestration Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time status indicator */}
              <div className="flex items-center space-x-2 bg-success/10 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full status-pulse"></div>
                <span className="text-sm font-medium text-success">Live</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="text-primary" size={16} />
                </div>
                <span className="text-sm font-medium text-foreground">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <MetricsCards data={systemStatus} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReplitInterface />
            </div>
            <div>
              <AgentPools data={systemStatus?.agentPools} />
            </div>
          </div>
          
          <TaskQueue />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemHealth data={healthData} />
            <div className="bg-card rounded-xl border border-border">
              <div className="border-b border-border p-6">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <p className="text-muted-foreground text-sm">System events and notifications</p>
              </div>
              
              <div className="p-6 space-y-4">
                {activityData?.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'system' ? 'bg-success' :
                      activity.type === 'task' ? 'bg-primary' :
                      activity.type === 'error' ? 'bg-error' :
                      'bg-warning'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
