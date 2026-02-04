import { History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import fetterAiLogo from "@/assets/fetter-ai-logo.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ChatHeaderProps {
  onMenuClick: () => void;
  onHistoryClick: () => void;
}

const ChatHeader = ({ onMenuClick, onHistoryClick }: ChatHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout में समस्या हुई");
    } else {
      toast.success("Logout सफल!");
      navigate("/auth");
    }
  };

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={fetterAiLogo}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-base font-medium text-foreground">
            Fetter AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-foreground font-medium text-sm">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <Button
                onClick={onHistoryClick}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <History className="h-5 w-5" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary text-sm"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
