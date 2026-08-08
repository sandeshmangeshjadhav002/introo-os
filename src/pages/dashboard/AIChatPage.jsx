import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles, CheckCircle, ChevronRight } from "lucide-react";
import { useAIStore } from "../../stores/useAIStore";
import { useSupabase } from "../../context/SupabaseContext";
import { processUserMessage } from "../../ai/service";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function AIChatPage() {
  const {
    conversations,
    currentConversationId,
    isThinking,
    currentPlan,
    currentStep,
    toolExecutions,
    isExecutingPlan,
    addMessage,
    createConversation,
    setIsThinking,
    setCurrentPlan,
    setCurrentStep,
    setIsExecutingPlan,
    addToolExecution,
    clearToolExecutions,
    resetAgentState
  } = useAIStore();

  const {
    user,
    organization,
    supabase,
    loading: isAuthLoading
  } = useSupabase();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentConversationId, currentPlan, toolExecutions]);

  // Initialize conversation if needed
  useEffect(() => {
    if (user && !currentConversationId) {
      console.log('AI Chat: Creating new conversation');
      const id = crypto.randomUUID();
      createConversation(id);
    }
  }, [user, currentConversationId, createConversation]);

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking || isExecutingPlan || isAuthLoading) {
      return;
    }

    const message = inputValue.trim();
    setInputValue("");

    await processUserMessage({
      message,
      conversationId: currentConversationId,
      supabase,
      user,
      organization,
      addMessage,
      setIsThinking,
      setCurrentPlan,
      setCurrentStep,
      setIsExecutingPlan,
      addToolExecution,
      clearToolExecutions,
      resetAgentState
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Business Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Agentic AI for your Introo OS workspace
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Agentic Plan View */}
          {currentPlan.length > 0 && (
            <Card className="p-5 border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Loader2 className={`w-4 h-4 ${isExecutingPlan ? 'animate-spin' : ''}`} />
                {isExecutingPlan ? 'Executing Plan...' : 'Execution Plan'}
              </h3>
              <ol className="space-y-2">
                {currentPlan.map((step, idx) => {
                  const isCompleted = idx < currentStep - 1;
                  const isActive = idx === currentStep - 1;
                  const isPending = idx >= currentStep;

                  return (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                        isCompleted
                          ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : isActive
                            ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50" />
                      )}
                      <span className="font-mono font-bold mr-1">Step {step.step}:</span>
                      {step.description}
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {/* Tool Execution Timeline */}
          {toolExecutions.length > 0 && (
            <Card className="p-5 border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Tool Execution History
              </h3>
              <div className="space-y-3">
                {toolExecutions.map((exec, idx) => (
                  <div
                    key={exec.id}
                    className={`p-3 rounded-lg border ${
                      exec.status === 'completed'
                        ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
                        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        Step {exec.step}
                      </span>
                      <code className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {exec.tool}
                      </code>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        exec.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      }`}>
                        {exec.status}
                      </span>
                    </div>
                    {exec.result && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                          View result (click to expand)
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(exec.result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Chat Messages */}
          {currentConversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-[80%] ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-blue-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && !isExecutingPlan && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something like 'Show me all my clients' or 'What's my project status'..."
                className="w-full bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 resize-none max-h-32"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking || isExecutingPlan || isAuthLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
