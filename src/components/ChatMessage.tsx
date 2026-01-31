import { User, FileText, Image as ImageIcon } from "lucide-react";
import fetterAiLogo from "@/assets/fetter-ai-logo.jpg";

interface AttachedFile {
  name: string;
  type: string;
  url?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  files?: AttachedFile[];
}

const ChatMessage = ({ role, content, files }: ChatMessageProps) => {
  const isUser = role === "user";

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const imageFiles = files?.filter(f => f.type.startsWith("image/") && f.url);
  const otherFiles = files?.filter(f => !f.type.startsWith("image/") || !f.url);

  return (
    <div
      className={`flex gap-3 p-4 animate-fade-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden
          ${isUser ? "bg-primary" : "bg-card shadow-md border border-border"}`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary-foreground" />
        ) : (
          <img src={fetterAiLogo} alt="Fetter AI" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[80%] space-y-2 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Image Previews */}
        {imageFiles && imageFiles.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isUser ? "justify-end" : ""}`}>
            {imageFiles.map((file, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden border border-border shadow-sm"
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-[200px] max-h-[200px] object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Other Attached Files */}
        {otherFiles && otherFiles.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isUser ? "justify-end" : ""}`}>
            {otherFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg text-sm"
              >
                {getFileIcon(file.type)}
                <span className="text-foreground">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message Text */}
        <div
          className={`px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap
            ${
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card text-foreground rounded-bl-md shadow-sm border border-border"
            }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
