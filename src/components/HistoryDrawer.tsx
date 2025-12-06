import { X, MessageSquare, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  chatHistory: ChatHistory[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
}

const HistoryDrawer = ({
  isOpen,
  onClose,
  onNewChat,
  chatHistory,
  currentChatId,
  onSelectChat,
}: HistoryDrawerProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-card shadow-xl z-50 animate-fade-in">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">चैट हिस्ट्री</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>


            <Button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="h-4 w-4" />
              नई चैट
            </Button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="चैट खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm text-foreground 
                  placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="space-y-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left 
                      transition-colors
                      ${
                        currentChatId === chat.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">{chat.date}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-8 text-sm text-muted-foreground text-center">
                  {chatHistory.length === 0
                    ? "कोई चैट नहीं है"
                    : "कोई चैट नहीं मिली"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;
