import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import pharmacyLogo from "@/assets/pharmacy-logo.jpg";

interface ChatHeaderProps {
  onMenuClick: () => void;
  onHistoryClick: () => void;
}

const ChatHeader = ({ onMenuClick, onHistoryClick }: ChatHeaderProps) => {
  return (
    <header className="gradient-header px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-card shadow-md overflow-hidden flex-shrink-0">
            <img
              src={pharmacyLogo}
              alt="MK Pharmacy Hub Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">
              Mk pharmacy Hub AI
            </h1>
            <p className="text-sm text-primary-foreground/80">
              आपकी स्वास्थ्य सहायक
            </p>
          </div>
        </div>

        <Button
          onClick={onHistoryClick}
          variant="ghost"
          className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 px-3"
        >
          <History className="h-5 w-5" />
          <span className="text-sm font-medium">History</span>
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
