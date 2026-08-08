import { allTools, executeTool } from "./tools";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SYSTEM_PROMPT = `You are Introo OS AI Assistant, an agentic business AI.
Your job is to:
1. Understand the user's request
2. Plan what steps to take
3. Use available tools to execute the steps
4. Reflect on the results
5. Repeat until the task is complete

Available Tools:
${allTools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}
`;

const mockLLM = async (messages) => {
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content || "";
  const lower = lastUserMsg.toLowerCase();
  const toolResults = messages.filter((m) => m.role === "tool");

  if (toolResults.length > 0) {
    const lastToolResult = toolResults[toolResults.length - 1];
    try {
      const result = JSON.parse(lastToolResult.content);
      const toolName = lastToolResult.name;

      if (toolName === "get_workspace_summary") {
        return JSON.stringify({
          type: "answer",
          content: `Here's your Introo OS Workspace Overview:\n\n📊 Total Clients: ${result.data.total_clients}\n🚀 Active Projects: ${result.data.active_projects}\n✅ Pending Tasks: ${result.data.pending_tasks}\n💰 Total Revenue: $${result.data.total_revenue.toLocaleString()}\n👥 Active Employees: ${result.data.active_employees}\n\nYour workspace is up and running!`,
        });
      }
      if (toolName === "get_all_clients") {
        return JSON.stringify({
          type: "answer",
          content: `Here are your ${result.data.length} clients:\n\n${result.data.map((c) => `• ${c.company_name} (${c.email})`).join("\n")}`,
        });
      }
      if (toolName === "get_all_projects") {
        return JSON.stringify({
          type: "answer",
          content: `Your Projects:\n\n${result.data.map((p) => `• ${p.name} (${p.status})`).join("\n")}`,
        });
      }
      if (toolName === "get_all_tasks") {
        const byStatus = result.data.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || []).concat(t);
          return acc;
        }, {});
        return JSON.stringify({
          type: "answer",
          content: `Your Tasks:\n\n${["todo", "in_progress", "done"]
            .map((status) =>
              byStatus[status]
                ? `### ${status.charAt(0).toUpperCase() + status.slice(1)}:\n${byStatus[status].map((t) => `• [${t.priority}] ${t.title}`).join("\n")}`
                : "",
            )
            .join("\n")}\n\nTotal: ${result.data.length} tasks`,
        });
      }
    } catch (e) {}
    return JSON.stringify({
      type: "answer",
      content: `I've completed your request!`,
    });
  }

  if (
    lower.includes("summary") ||
    lower.includes("overview") ||
    lower.includes("stats")
  ) {
    return JSON.stringify({
      type: "thinking",
      content: "I need to get a workspace summary first.",
      nextStep: "call_tool",
    });
  } else if (lower.includes("client")) {
    return JSON.stringify({
      type: "thinking",
      content: "I need to get all clients first.",
      nextStep: "call_tool",
    });
  } else if (lower.includes("project")) {
    return JSON.stringify({
      type: "thinking",
      content: "I need to get all projects first.",
      nextStep: "call_tool",
    });
  } else if (lower.includes("task")) {
    return JSON.stringify({
      type: "thinking",
      content: "I need to get all tasks first.",
      nextStep: "call_tool",
    });
  } else {
    return JSON.stringify({
      type: "answer",
      content: `I'm your Introo OS AI Assistant! Here's what I can help with:\n\n📇 **CRM**: Clients, Contacts, Deals\n📋 **Projects**: Create projects, milestones, sprints\n✅ **Tasks**: Manage tasks, mark complete\n👥 **HR**: Employee management\n💰 **Finance**: Invoices, expenses, revenue\n📊 **Summary**: Get workspace overview\n\nTry: "Show me my workspace summary", "What clients do I have?"`,
    });
  }
};

const getToolCallFromThinking = (content) => {
  const lower = content.toLowerCase();
  if (lower.includes("workspace summary"))
    return { name: "get_workspace_summary", params: {} };
  if (lower.includes("all clients"))
    return { name: "get_all_clients", params: {} };
  if (lower.includes("all projects"))
    return { name: "get_all_projects", params: {} };
  if (lower.includes("all tasks")) return { name: "get_all_tasks", params: {} };
  return null;
};

export const processUserMessage = async ({
  message,
  conversationId,
  supabase,
  user,
  organization,
  addMessage,
  setIsThinking,
  setCurrentPlan,
  setCurrentStep,
  setIsExecutingPlan,
  addToolExecution,
  resetAgentState,
}) => {
  console.log("🤖 Agentic AI: Starting", message);

  resetAgentState();
  addMessage(conversationId, {
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: new Date(),
  });
  setIsThinking(true);
  await delay(600);

  try {
    let conversationHistory = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ];
    let stepNumber = 1;
    const maxSteps = 10;
    const allToolResults = [];

    while (stepNumber <= maxSteps) {
      console.log(`🤖 Agentic AI: Step ${stepNumber}`);
      setCurrentStep(stepNumber);
      setIsExecutingPlan(stepNumber > 1);

      const llmResponseRaw = await mockLLM(conversationHistory);
      let llmResponse;
      try {
        llmResponse = JSON.parse(llmResponseRaw);
      } catch (e) {
        llmResponse = { type: "answer", content: llmResponseRaw };
      }

      if (llmResponse.type === "thinking") {
        setCurrentPlan((prev) => [
          ...prev,
          { step: stepNumber, description: llmResponse.content, tool: null },
        ]);
        addMessage(conversationId, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `💭 ${llmResponse.content}`,
          timestamp: new Date(),
        });
        await delay(600);

        if (llmResponse.nextStep === "call_tool") {
          let toolCall = getToolCallFromThinking(llmResponse.content);
          if (!toolCall) toolCall = getToolCallFromThinking(message);

          if (toolCall) {
            const executionId = crypto.randomUUID();
            addToolExecution({
              id: executionId,
              tool: toolCall.name,
              status: "executing",
              step: stepNumber,
              timestamp: new Date(),
            });
            await delay(600);

            const { data, error } = await executeTool(
              toolCall.name,
              toolCall.params,
              { supabase, organizationId: organization?.id },
            );

            if (error) {
              addToolExecution({
                id: executionId,
                tool: toolCall.name,
                status: "failed",
                error: error,
                step: stepNumber,
                timestamp: new Date(),
              });
              conversationHistory.push({
                role: "tool",
                name: toolCall.name,
                content: JSON.stringify({ error }),
              });
            } else {
              addToolExecution({
                id: executionId,
                tool: toolCall.name,
                status: "completed",
                result: data,
                step: stepNumber,
                timestamp: new Date(),
              });
              allToolResults.push({ tool: toolCall.name, data });
              conversationHistory.push({
                role: "tool",
                name: toolCall.name,
                content: JSON.stringify({ data }),
              });
            }
          }
        }
        stepNumber++;
        continue;
      }

      if (llmResponse.type === "answer") {
        setIsThinking(false);
        setIsExecutingPlan(false);
        addMessage(conversationId, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: llmResponse.content,
          timestamp: new Date(),
        });
        return;
      }

      stepNumber++;
    }

    setIsThinking(false);
    setIsExecutingPlan(false);
    addMessage(conversationId, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "I've been working on this for a while. Let me summarize.",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Agentic AI Error:", error);
    setIsThinking(false);
    setIsExecutingPlan(false);
    addMessage(conversationId, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Sorry, I encountered an error: ${error.message}`,
      timestamp: new Date(),
    });
  }
};
