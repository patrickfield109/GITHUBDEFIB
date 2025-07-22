import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SystemHealthProps {
  data?: any;
}

export function SystemHealth({ data }: SystemHealthProps) {
  const metrics = data?.metrics || {};
  const cpuUsage = metrics.cpu || 0;
  const memoryUsage = metrics.memory || 0;
  const responseTime = metrics.responseTime || 0;

  const getProgressColor = (value: number, type: "cpu" | "memory" | "response") => {
    if (type === "response") {
      if (value < 100) return "bg-success";
      if (value < 200) return "bg-warning";
      return "bg-error";
    } else {
      if (value < 50) return "bg-success";
      if (value < 80) return "bg-warning";
      return "bg-error";
    }
  };

  return (
    <Card>
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold text-foreground">System Health</h3>
        <p className="text-muted-foreground text-sm">Real-time performance monitoring</p>
      </div>
      
      <CardContent className="p-6 space-y-6">
        {/* CPU Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">CPU Usage</span>
            <span className="text-sm text-muted-foreground">{cpuUsage}%</span>
          </div>
          <Progress 
            value={cpuUsage} 
            className="h-3"
          />
        </div>
        
        {/* Memory Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Memory Usage</span>
            <span className="text-sm text-muted-foreground">{memoryUsage}%</span>
          </div>
          <Progress 
            value={memoryUsage} 
            className="h-3"
          />
        </div>
        
        {/* API Response Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">API Response Time</span>
            <span className="text-sm text-muted-foreground">{responseTime}ms</span>
          </div>
          <Progress 
            value={Math.min((responseTime / 300) * 100, 100)} 
            className="h-3"
          />
        </div>

        {/* Overall Health Score */}
        {data?.overall && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Overall Health Score</p>
                <p className="text-xs text-muted-foreground capitalize">{data.overall.status}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{data.overall.score.toFixed(1)}%</p>
                <div className={`w-2 h-2 rounded-full inline-block ${
                  data.overall.score >= 95 ? "bg-success" :
                  data.overall.score >= 85 ? "bg-warning" :
                  "bg-error"
                }`}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
