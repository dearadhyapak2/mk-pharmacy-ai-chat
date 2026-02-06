import { useState, useRef } from "react";
import { Send, Plus, X, FileText, Image as ImageIcon, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  onGenerateImage?: (prompt: string) => void;
  isLoading: boolean;
}

type InputMode = "chat" | "image";

const ChatInput = ({ onSendMessage, onGenerateImage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "image" && message.trim() && onGenerateImage) {
      onGenerateImage(message);
      setMessage("");
      setInputMode("chat");
    } else if (message.trim() || attachedFiles.length > 0) {
      onSendMessage(message, attachedFiles);
      setMessage("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMenuOpen(false);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setMenuOpen(false);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const menuItems = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: "File",
      onClick: () => {
        fileInputRef.current?.click();
      },
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      label: "Image Generate",
      onClick: () => {
        setInputMode("image");
        setMenuOpen(false);
      },
    },
    {
      icon: <Camera className="h-5 w-5" />,
      label: "Photo",
      onClick: () => {
        cameraInputRef.current?.click();
      },
    },
  ];

  return (
    <div className="p-3 bg-card border-t border-border">
      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm"
            >
              {getFileIcon(file)}
              <span className="max-w-[150px] truncate text-foreground">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image mode indicator */}
      {inputMode === "image" && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs text-primary font-medium">Image Generate Mode</span>
          <button
            onClick={() => setInputMode("chat")}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleCameraCapture}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Plus Menu Button */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`rounded-full flex-shrink-0 h-10 w-10 transition-all ${
              menuOpen
                ? "bg-secondary text-foreground rotate-45"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Popup Menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-14 left-0 z-20 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[180px] animate-fade-in">
                {menuItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              inputMode === "image"
                ? "Image describe करें... (जैसे: सुंदर पहाड़ों की तस्वीर)"
                : "कुछ पूछें..."
            }
            className={`w-full px-4 py-2.5 rounded-full text-foreground 
              placeholder:text-muted-foreground focus:outline-none focus:ring-1 text-sm ${
                inputMode === "image"
                  ? "bg-primary/10 focus:ring-primary"
                  : "bg-secondary focus:ring-primary/50"
              }`}
          />
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || (!message.trim() && attachedFiles.length === 0)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 w-10
            flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
