import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import WelcomeScreen from "@/components/WelcomeScreen";
import HistoryDrawer from "@/components/HistoryDrawer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string }[];
}

interface Chat {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Index = () => {
  const { toast } = useToast();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (
    chatMessages: { role: string; content: string }[],
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
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
    const fileAttachments = files?.map((f) => ({ name: f.name, type: f.type }));

    let chatId = currentChatId;
    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
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
      content,
      files: fileAttachments,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );

    setIsLoading(true);

    // Get current messages for context
    const currentMessages = chats.find((c) => c.id === chatId)?.messages || [];
    const apiMessages = [
      ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];

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
      console.error("Chat error:", error);
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

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <ChatHeader
        onMenuClick={() => {}}
        onHistoryClick={() => setHistoryOpen(true)}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
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
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* History Drawer */}
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
