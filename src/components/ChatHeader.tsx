import { History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import pharmacyLogo from "@/assets/pharmacy-logo.jpg";
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
    <header className="gradient-header px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-card shadow-md overflow-hidden flex-shrink-0">
            <img
              src={pharmacyLogo}
              alt="MK Pharmacy Hub Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary-foreground whitespace-nowrap">
              Mk pharmacy Hub AI
            </h1>
            <p className="text-xs text-primary-foreground/80">
              आपकी स्वास्थ्य सहायक
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground text-primary font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <Button
                onClick={onHistoryClick}
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <History className="h-5 w-5" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 text-sm"
            >
              Signup
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
