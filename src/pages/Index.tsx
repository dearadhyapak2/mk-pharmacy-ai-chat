import { useState, useRef, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import WelcomeScreen from "@/components/WelcomeScreen";
import HistoryDrawer from "@/components/HistoryDrawer";
import { useAuth } from "@/hooks/useAuth";

interface AttachedFile {
  name: string;
  type: string;
  url?: string; // base64 data URL for images
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: AttachedFile[];
}

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

// Convert file to base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const Index = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const authHeaders = useMemo(() => {
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (
    chatMessages: { role: string; content: string | MessageContent[] }[],
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        throw new Error("Session समाप्त हो गई है, कृपया फिर से login करें।");
      }
      if (resp.status === 429) {
        throw new Error(errorData.error || "बहुत ज्यादा requests, कृपया थोड़ी देर बाद कोशिश करें।");
      }
      if (resp.status === 402) {
        throw new Error(errorData.error || "Credits समाप्त हो गए हैं।");
      }
      throw new Error(errorData.error || "AI से जुड़ने में समस्या हुई");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    onDone();
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    // Process files - convert images to base64
    const processedFiles: AttachedFile[] = [];
    const imageBase64s: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file);
          processedFiles.push({ name: file.name, type: file.type, url: base64 });
          imageBase64s.push(base64);
        } else {
          processedFiles.push({ name: file.name, type: file.type });
        }
      }
    }

    let chatId = currentChatId;
    if (!chatId) {
      const title = content.trim() 
        ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
        : "📸 Photo Analysis";
      const newChat: Chat = {
        id: Date.now().toString(),
        title,
        date: new Date().toLocaleDateString("hi-IN"),
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content || "इस photo को analyze करें",
      files: processedFiles.length > 0 ? processedFiles : undefined,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
      )
    );

    setIsLoading(true);

    // Build API messages with multimodal support
    const currentMessages = chats.find((c) => c.id === chatId)?.messages || [];
    const apiMessages: { role: string; content: string | MessageContent[] }[] = currentMessages.map((m) => {
      // Check if message has image files
      const imageFiles = m.files?.filter(f => f.type.startsWith("image/") && f.url);
      if (imageFiles && imageFiles.length > 0) {
        const contentParts: MessageContent[] = [];
        imageFiles.forEach(img => {
          if (img.url) {
            contentParts.push({ type: "image_url", image_url: { url: img.url } });
          }
        });
        if (m.content) {
          contentParts.push({ type: "text", text: m.content });
        }
        return { role: m.role, content: contentParts };
      }
      return { role: m.role, content: m.content };
    });

    // Add current message
    if (imageBase64s.length > 0) {
      const contentParts: MessageContent[] = [];
      imageBase64s.forEach(base64 => {
        contentParts.push({ type: "image_url", image_url: { url: base64 } });
      });
      contentParts.push({ type: "text", text: content || "इस photo को analyze करें" });
      apiMessages.push({ role: "user", content: contentParts });
    } else {
      apiMessages.push({ role: "user", content });
    }

    let assistantContent = "";

    try {
      await streamChat(
        apiMessages,
        (chunk) => {
          assistantContent += chunk;
          setChats((prev) =>
            prev.map((chat) => {
              if (chat.id !== chatId) return chat;
              const msgs = chat.messages;
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg?.role === "assistant") {
                return {
                  ...chat,
                  messages: msgs.map((m, i) =>
                    i === msgs.length - 1 ? { ...m, content: assistantContent } : m
                  ),
                };
              }
              return {
                ...chat,
                messages: [
                  ...msgs,
                  {
                    id: (Date.now() + 1).toString(),
                    role: "assistant" as const,
                    content: assistantContent,
                  },
                ],
              };
            })
          );
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (error) {
      toast({
        title: "त्रुटि",
        description: error instanceof Error ? error.message : "कुछ गलत हो गया",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
  };

  const handleGenerateImage = async (prompt: string) => {
    let chatId = currentChatId;
    if (!chatId) {
      const title = `🎨 ${prompt.slice(0, 25)}${prompt.length > 25 ? "..." : ""}`;
      const newChat: Chat = {
        id: Date.now().toString(),
        title,
        date: new Date().toLocaleDateString("hi-IN"),
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🎨 Image Generate: ${prompt}`,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, userMessage] } : chat
      )
    );

    setIsLoading(true);

    try {
      const response = await fetch(IMAGE_GEN_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generate करने में समस्या हुई");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `${data.message}\n\n![Generated Image](${data.imageUrl})`,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      toast({
        title: "त्रुटि",
        description: error instanceof Error ? error.message : "Image generate नहीं हो पाई",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <ChatHeader onMenuClick={() => {}} onHistoryClick={() => setHistoryOpen(true)} />

      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="max-w-3xl mx-auto pb-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                files={message.files}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-card shadow-md border border-border flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onGenerateImage={handleGenerateImage}
          isLoading={isLoading} 
        />
      </div>

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        chatHistory={chats.map((c) => ({ id: c.id, title: c.title, date: c.date }))}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
      />
    </div>
  );
};

export default Index;
