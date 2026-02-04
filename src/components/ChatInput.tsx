import { useState, useRef } from "react";
import { Send, Paperclip, X, FileText, Image as ImageIcon, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  onGenerateImage?: (prompt: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, onGenerateImage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isImageMode, setIsImageMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isImageMode && message.trim() && onGenerateImage) {
      onGenerateImage(message);
      setMessage("");
      setIsImageMode(false);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

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
              <span className="max-w-[150px] truncate text-foreground">
                {file.name}
              </span>
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        {/* Camera Capture Input */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleCameraCapture}
          className="hidden"
          accept="image/*"
          capture="environment"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full flex-shrink-0 h-9 w-9"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsImageMode(!isImageMode)}
          className={`hover:bg-secondary rounded-full flex-shrink-0 h-9 w-9 ${
            isImageMode 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Image Generate करें"
        >
          <Sparkles className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => cameraInputRef.current?.click()}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full flex-shrink-0 h-9 w-9"
        >
          <Camera className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isImageMode ? "Image describe करें... (जैसे: सुंदर पहाड़ों की तस्वीर)" : "कुछ पूछें..."}
            className={`w-full px-4 py-2.5 rounded-full text-foreground 
              placeholder:text-muted-foreground focus:outline-none focus:ring-1 text-sm ${
                isImageMode 
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
