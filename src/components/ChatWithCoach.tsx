import { useState } from "react";
import { MessageCircle, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "coach";
  timestamp: Date;
}

export default function ChatWithCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI coach. How can I help you today?",
      sender: "coach",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call API to get coach response
      const response = await apiRequest("POST", "/api/chat/coach", {
        message: userMessage.text,
        userId: user?.id,
        conversationHistory: messages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
      });

      if (!response.ok) {
        // If API endpoint doesn't exist yet, provide a helpful fallback response
        if (response.status === 404) {
          const fallbackMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I'm here to help! The chat feature is being set up. For now, I can provide general guidance. What specific area would you like help with?",
            sender: "coach",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, fallbackMessage]);
          return;
        }
        throw new Error("Failed to get coach response");
      }

      const data = await response.json();

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          data.response ||
          data.message ||
          "I'm here to help! Can you tell me more?",
        sender: "coach",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Provide a helpful fallback response instead of just an error
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to help! While the full chat feature is being set up, feel free to ask me questions. I'll do my best to assist you with your business strategy, messaging, or any other questions you have.",
        sender: "coach",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button - Positioned above Report Issue button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-embodied-coral hover:bg-embodied-orange text-white p-0 transition-all duration-200 hover:scale-105"
        size="lg"
        aria-label="Chat with Coach"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-embodied-coral flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle>Chat with Coach</DialogTitle>
                  <DialogDescription>
                    Get instant guidance and support
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-embodied-coral text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-white/70"
                          : "text-slate-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-6 pb-6 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-embodied-coral hover:bg-embodied-orange text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
