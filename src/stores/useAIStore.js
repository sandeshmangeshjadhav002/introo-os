import { create } from 'zustand'

export const useAIStore = create((set, get) => ({
  // Conversation state
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  // Agent state
  isThinking: false,
  currentPlan: [], // Array of step-by-step plan items
  toolExecutions: [], // Array of all tool calls made
  currentStep: 0, // Current step in the plan
  isExecutingPlan: false,

  // Actions
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsThinking: (isThinking) => set({ isThinking }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setIsExecutingPlan: (isExecuting) => set({ isExecutingPlan: isExecuting }),
  addToolExecution: (execution) => set((state) => ({
    toolExecutions: [...state.toolExecutions, execution]
  })),
  clearToolExecutions: () => set({ toolExecutions: [] }),
  setError: (error) => set({ error }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    })),

  createConversation: (id) =>
    set((state) => {
      const newConversation = { id, messages: [], createdAt: new Date() }
      return {
        conversations: [...state.conversations, newConversation],
        currentConversationId: id
      }
    }),

  selectConversation: (id) => set({ currentConversationId: id }),

  resetAgentState: () => set({
    currentPlan: [],
    currentStep: 0,
    toolExecutions: [],
    isExecutingPlan: false,
    isThinking: false
  }),

  clearError: () => set({ error: null })
}))
