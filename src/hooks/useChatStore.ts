import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Message = { role: "user" | "assistant"; content: string };

export interface CollectedInfo {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  industry?: string;
  projectType?: "website" | "app" | null;
  budget?: string;
  timeline?: string;
  description?: string;
}

export type ProjectType = "website" | "app";

const MAX_USER_MESSAGES = 60;

interface ChatStore {
  messages: Message[];
  collectedInfo: CollectedInfo;
  isOpen: boolean;
  userMessageCount: number;
  addMessage: (message: Message) => void;
  updateLastAssistant: (content: string) => void;
  updateCollectedInfo: (info: CollectedInfo) => void;
  setIsOpen: (open: boolean) => void;
  clearChat: () => void;
  canSendMessage: () => boolean;
  getRemainingMessages: () => number;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hey! 👋 Looking to build a website? Tell me about your project.",
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [INITIAL_MESSAGE],
      collectedInfo: {},
      isOpen: false,
      userMessageCount: 0,
      addMessage: (message) =>
        set((state) => {
          const newCount = message.role === "user" 
            ? state.userMessageCount + 1 
            : state.userMessageCount;
          return { 
            messages: [...state.messages, message],
            userMessageCount: newCount,
          };
        }),
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
      clearChat: () => set({ 
        messages: [INITIAL_MESSAGE], 
        collectedInfo: {},
        userMessageCount: 0,
      }),
      canSendMessage: () => get().userMessageCount < MAX_USER_MESSAGES,
      getRemainingMessages: () => MAX_USER_MESSAGES - get().userMessageCount,
    }),
    {
      name: "sited-chat-storage",
    }
  )
);