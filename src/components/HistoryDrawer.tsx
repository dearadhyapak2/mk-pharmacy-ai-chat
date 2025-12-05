import { X, MessageSquare, Plus, Search, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      toast.error("Login में समस्या हुई");
      console.error("Login error:", error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout में समस्या हुई");
    } else {
      toast.success("Logout सफल!");
    }
    setLoading(false);
  };

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

            {/* Gmail Login/Logout */}
            <div className="mb-3">
              {user ? (
                <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                  <img 
                    src={user.user_metadata?.avatar_url || ''} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-secondary/80 text-foreground gap-2"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Gmail से Login करें
                </Button>
              )}
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
