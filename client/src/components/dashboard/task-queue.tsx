import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, MoreHorizontal } from "lucide-react";

export function TaskQueue() {
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "processing":
        return "bg-warning/10 text-warning";
      case "queued":
        return "bg-muted text-muted-foreground";
      case "failed":
        return "bg-error/10 text-error";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "medical_analysis":
        return "bg-success/10 text-success";
      case "stock_analysis":
        return "bg-accent/10 text-accent";
      case "workflow_automation":
        return "bg-primary/10 text-primary";
      case "sports_betting":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const processingTasks = tasks?.filter((task: any) => task.status === "processing").length || 0;
  const queuedTasks = tasks?.filter((task: any) => task.status === "queued").length || 0;
  const recentTasks = tasks?.slice(0, 10) || [];

  return (
    <Card>
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Active Task Queue</h3>
            <p className="text-muted-foreground text-sm">Real-time task processing and monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{processingTasks}</span> processing
              <span className="mx-2">•</span>
              <span className="font-medium">{queuedTasks}</span> queued
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 ${isLoading ? "animate-spin" : ""}`} size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        ) : recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Task ID</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Progress</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Started</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task: any) => (
                  <tr key={task.id} className="border-b border-border/50">
                    <td className="py-4">
                      <span className="font-mono text-sm text-muted-foreground">{task.taskId}</span>
                    </td>
                    <td className="py-4">
                      <Badge className={getTypeColor(task.type)}>
                        {task.type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="w-20">
                        <Progress value={task.progress || 0} className="h-2" />
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No tasks in queue</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
