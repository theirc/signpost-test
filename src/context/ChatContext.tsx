import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { api } from '@/api/getBots'; // Assuming api path
import type { Option } from '@/components/ui/multiselect'; // Assuming Option path
import type { BotHistory, ChatMessage as ChatMessageType } from '@/types/types.ai'; // Assuming types path

interface Bots {
  [index: number]: {
    name: string;
    id: string;
    history: BotHistory[];
  };
}

// Define constants for known agent IDs (if needed context-wide)
const AGENT_ID_23 = 23;
const AGENT_ID_27 = 27;
const KNOWN_AGENT_IDS = [AGENT_ID_23, AGENT_ID_27];


interface ChatContextState {
  bots: Bots;
  selectedBots: number[];
  sidebarVisible: boolean;
  loadingBots: boolean;
}

interface ChatContextActions {
  handleBotSelectionChange: (selected: number[]) => void;
  toggleSidebar: () => void;
  // Add other actions if needed, e.g., reset chat
}

// Combine state and actions for the context value
interface ChatContextValue extends ChatContextState, ChatContextActions {
  options: Option[]; // Derived state
}

// Create the context with a default value (can be undefined or a default object)
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Create the Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bots, setBots] = useState<Bots>({});
  const [selectedBots, setSelectedBots] = useState<number[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loadingBots, setLoadingBots] = useState(true);

  // Fetch initial bots
  useEffect(() => {
    async function initBots() {
      setLoadingBots(true);
      try {
        const sb = await api.getBots();
        const fetchedBots: Bots = {};
        for (const key in sb) {
          fetchedBots[Number(key)] = { name: sb[key], id: key, history: [] };
        }
        // Add known agents manually
        fetchedBots[AGENT_ID_23] = { name: `Agent ${AGENT_ID_23}`, id: AGENT_ID_23.toString(), history: [] };
        fetchedBots[AGENT_ID_27] = { name: `Aprendia Test`, id: AGENT_ID_27.toString(), history: [] };
        setBots(fetchedBots);
      } catch (error) {
        console.error("Failed to initialize bots:", error);
        // Handle error appropriately
      } finally {
        setLoadingBots(false);
      }
    }
    initBots();
  }, []);

  // Handler for bot selection changes
  const handleBotSelectionChange = useCallback((selectedIds: number[]) => {
     // Basic check to prevent unnecessary updates if selection is the same
     if (JSON.stringify(selectedBots) !== JSON.stringify(selectedIds)) {
        console.log("Context: Setting selected bots:", selectedIds);
        setSelectedBots(selectedIds);
        // Note: Resetting messages/activeChat based on selection change should happen
        // within the Chat component itself when it detects a change in selectedBots from context.
     }
  }, [selectedBots]); // Depend on selectedBots to ensure stability


  // Handler to toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  // Derive options for the dropdown
  const options = useMemo((): Option[] => {
    return Object.keys(bots).map((k) => ({
      label: bots[Number(k)].name,
      value: k,
    }));
  }, [bots]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    bots,
    selectedBots,
    sidebarVisible,
    loadingBots,
    handleBotSelectionChange,
    toggleSidebar,
    options,
  }), [bots, selectedBots, sidebarVisible, loadingBots, handleBotSelectionChange, toggleSidebar, options]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the ChatContext
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 