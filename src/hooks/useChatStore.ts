import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Message = { role: "user" | "assistant"; content: string };

export interface CollectedInfo {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  industry?: string;
  projectType?: "website" | "app" | "ai" | null;
  budget?: string;
  timeline?: string;
  description?: string;
}

export type ProjectType = "website" | "app" | "ai";

interface ChatStore {
  messages: Message[];
  collectedInfo: CollectedInfo;
  isOpen: boolean;
  addMessage: (message: Message) => void;
  updateLastAssistant: (content: string) => void;
  updateCollectedInfo: (info: CollectedInfo) => void;
  setIsOpen: (open: boolean) => void;
  clearChat: () => void;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hey! 👋 Website, app, or AI project? Let's chat.",
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [INITIAL_MESSAGE],
      collectedInfo: {},
      isOpen: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastAssistant: (content) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIndex = messages.length - 1;
          if (messages[lastIndex]?.role === "assistant") {
            messages[lastIndex] = { ...messages[lastIndex], content };
          }
          return { messages };
        }),
      updateCollectedInfo: (info) =>
        set((state) => ({ collectedInfo: { ...state.collectedInfo, ...info } })),
      setIsOpen: (isOpen) => set({ isOpen }),
      clearChat: () => set({ messages: [INITIAL_MESSAGE], collectedInfo: {} }),
    }),
    {
      name: "sited-chat-storage",
    }
  )
);