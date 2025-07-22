import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
}

export function ReplitInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content: "Welcome to OperatorOS! I'm your AI orchestration assistant. You can ask me about system status, submit tasks, manage agent pools, or request demos. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const commandMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest("POST", "/api/command", {
        command,
        sessionId: "default-session"
      });
      return response.json();
    },
    onSuccess: (data) => {
      const agentMessage: Message = {
        id: Date.now().toString() + "-agent",
        type: "agent",
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process command. Please try again.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        type: "agent",
        content: "❌ Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    commandMutation.mutate(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Replit Agent Interface</h3>
            <p className="text-muted-foreground text-sm">Primary conversational interface for OperatorOS</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full status-pulse"></div>
            <span className="text-sm font-medium text-success">Active</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        {/* Chat Messages */}
        <ScrollArea className="h-96 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-xl px-4 py-3 max-w-md ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.type === "agent" && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="text-primary" size={12} />
                      </div>
                      <span className="text-sm font-medium text-foreground">OperatorOS Agent</span>
                    </div>
                  )}
                  <div className={`text-sm whitespace-pre-wrap ${
                    message.type === "user" ? "text-primary-foreground" : "text-foreground"
                  }`}>
                    {message.content}
                  </div>
                  <p className={`text-xs mt-2 ${
                    message.type === "user" ? "text-primary-foreground/75" : "text-muted-foreground"
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {commandMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-3 max-w-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="text-primary" size={12} />
                    </div>
                    <span className="text-sm font-medium text-foreground">OperatorOS Agent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <span className="text-sm text-muted-foreground ml-2">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Chat Input */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your command or question..."
                disabled={commandMutation.isPending}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || commandMutation.isPending}
              className="px-6"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
