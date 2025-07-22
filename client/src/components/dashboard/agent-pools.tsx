import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, Cog, Trophy, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentPoolsProps {
  data?: any[];
}

export function AgentPools({ data }: AgentPoolsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const scaleMutation = useMutation({
    mutationFn: async ({ poolId, capacity }: { poolId: number; capacity: number }) => {
      const response = await apiRequest("POST", `/api/agent-pools/${poolId}/scale`, {
        capacity
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent pool scaling initiated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to scale agent pool",
        variant: "destructive"
      });
    }
  });

  const getPoolIcon = (type: string) => {
    switch (type) {
      case "healthcare":
        return Heart;
      case "financial":
        return TrendingUp;
      case "business_automation":
        return Cog;
      case "sports_analytics":
        return Trophy;
      default:
        return Cog;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success/10 text-success";
      case "scaling":
        return "bg-warning/10 text-warning";
      case "offline":
        return "bg-error/10 text-error";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleScalePool = (poolId: number, currentCapacity: number) => {
    scaleMutation.mutate({ poolId, capacity: currentCapacity + 2 });
  };

  return (
    <Card>
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold text-foreground">Agent Pools</h3>
        <p className="text-muted-foreground text-sm">Specialized domain agents</p>
      </div>
      
      <CardContent className="p-6 space-y-4">
        {data?.map((pool) => {
          const Icon = getPoolIcon(pool.type);
          
          return (
            <div key={pool.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  pool.type === "healthcare" ? "bg-success/10" :
                  pool.type === "financial" ? "bg-accent/10" :
                  pool.type === "business_automation" ? "bg-primary/10" :
                  "bg-warning/10"
                }`}>
                  <Icon className={
                    pool.type === "healthcare" ? "text-success" :
                    pool.type === "financial" ? "text-accent" :
                    pool.type === "business_automation" ? "text-primary" :
                    "text-warning"
                  } size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{pool.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pool.activeAgents}/{pool.capacity} agents
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(pool.status)}>
                  {pool.status}
                </Badge>
                {pool.status === "online" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScalePool(pool.id, pool.capacity)}
                    disabled={scaleMutation.isPending}
                  >
                    Scale +2
                  </Button>
                )}
              </div>
            </div>
          );
        }) || (
          <div className="text-center text-muted-foreground py-8">
            <p>No agent pools available</p>
          </div>
        )}
        
        <Button
          variant="outline"
          className="w-full border-dashed border-2"
          disabled={true}
        >
          <Plus className="mr-2" size={16} />
          Add Agent Pool
        </Button>
      </CardContent>
    </Card>
  );
}
