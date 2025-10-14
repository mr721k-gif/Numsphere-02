import { create } from "zustand";

export type BlockType = "say" | "menu" | "forward" | "multi_forward" | "pause" | "play" | "sms" | "hangup";

export interface Block {
  id: string;
  type: BlockType;
  position: { x: number; y: number };
  config: any;
  next?: string[];
}

export interface CallFlow {
  id: string;
  user_id: string;
  phone_number: string;
  flow_json: Block[];
  recording_enabled: boolean;
  // add optional name to reflect API shape
  name?: string;
  recording_disclaimer?: string;
  created_at?: string;
  updated_at?: string;
}

interface CallFlowState {
  flowName: string;
  selectedNumberId: string | null;
  blocks: Block[];
  selectedBlock: Block | null;
  connectingFrom: string | null;
  connectionMode: boolean;
  flows: CallFlow[];
  isSaving: boolean;
  currentFlow: CallFlow | null;

  // actions
  setFlowName: (name: string) => void;
  setSelectedNumberId: (id: string) => void;
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  setSelectedBlock: (block: Block | null) => void;
  setConnectingFrom: (id: string | null) => void;
  setConnectionMode: (mode: boolean) => void;
  connectBlocks: (from: string, to: string) => void;
  disconnectBlocks: (blockId: string, targetId: string) => void;
  loadFlows: (userId: string) => Promise<void>;
  saveFlow: (userId: string, phoneNumber: string, recordingEnabled: boolean) => Promise<boolean>;
  deleteFlow: (id: string, userId: string) => Promise<boolean>;
  setCurrentFlow: (flow: CallFlow | null) => void;
  resetEditor: () => void;
}

export const useCallFlowStore = create<CallFlowState>((set, get) => ({
  flowName: "",
  selectedNumberId: null,
  blocks: [],
  selectedBlock: null,
  connectingFrom: null,
  connectionMode: false,
  flows: [],
  isSaving: false,
  currentFlow: null,

  setFlowName: (flowName) => set({ flowName }),
  setSelectedNumberId: (id) => set({ selectedNumberId: id }),
  setBlocks: (blocks) => set({ blocks }),
  
  addBlock: (block) => {
    set({ blocks: [...get().blocks, block] });
  },
  
  updateBlock: (id, updates) => {
    const blocks = get().blocks.map((b) => 
      b.id === id ? { ...b, ...updates } : b
    );
    set({ 
      blocks,
      selectedBlock: get().selectedBlock?.id === id 
        ? { ...get().selectedBlock!, ...updates } 
        : get().selectedBlock
    });
  },
  
  deleteBlock: (id) => {
    // Remove the block and all connections to it
    const blocks = get().blocks.filter((b) => b.id !== id);
    const updatedBlocks = blocks.map((b) => ({
      ...b,
      next: b.next?.filter((nextId) => nextId !== id) || []
    }));
    
    set({ 
      blocks: updatedBlocks,
      selectedBlock: get().selectedBlock?.id === id ? null : get().selectedBlock
    });
  },
  
  setSelectedBlock: (block) => set({ selectedBlock: block }),
  setConnectingFrom: (id) => set({ connectingFrom: id }),
  setConnectionMode: (mode) => set({ connectionMode: mode }),
  
  connectBlocks: (from, to) => {
    const blocks = get().blocks.map((b) => {
      if (b.id === from) {
        const next = b.next || [];
        if (!next.includes(to)) {
          return { ...b, next: [...next, to] };
        }
      }
      return b;
    });
    set({ blocks });
  },
  
  disconnectBlocks: (blockId, targetId) => {
    // Remove specific connection from block
    const blocks = get().blocks.map((b) =>
      b.id === blockId 
        ? { ...b, next: (b.next || []).filter(id => id !== targetId) } 
        : b
    );
    set({ blocks });
  },
  
  loadFlows: async (userId) => {
    try {
      const res = await fetch(`/api/call-flows?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        set({ flows: data.flows || [] });
      }
    } catch (error) {
      console.error("Failed to load flows:", error);
    }
  },
  
  saveFlow: async (userId, phoneNumber, recordingEnabled) => {
    set({ isSaving: true });
    try {
      const res = await fetch("/api/call-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          phone_number: phoneNumber,
          flow_json: get().blocks,
          recording_enabled: recordingEnabled,
          // include flow name so it persists
          name: get().flowName || "Untitled Flow",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        set({ currentFlow: data.flow });
        await get().loadFlows(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save flow:", error);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },
  
  deleteFlow: async (id, userId) => {
    try {
      const res = await fetch(`/api/call-flows?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().loadFlows(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete flow:", error);
      return false;
    }
  },
  
  setCurrentFlow: (flow) => set({ currentFlow: flow }),
  
  resetEditor: () =>
    set({
      flowName: "",
      selectedNumberId: null,
      blocks: [],
      selectedBlock: null,
      connectingFrom: null,
      connectionMode: false,
      currentFlow: null,
    }),
}));