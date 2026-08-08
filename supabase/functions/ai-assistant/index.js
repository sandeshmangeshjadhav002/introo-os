// Supabase Edge Function for AI Assistant LLM Integration (JavaScript)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define tool schemas for LLM (inlined)
const allTools = [
  {
    type: "function",
    function: {
      name: "get_all_clients",
      description: "Get all clients in the organization",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_projects",
      description: "Get all projects in the organization",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_tasks",
      description: "Get all tasks in the organization",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    // Get user from request
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Get request body
    const { message, conversationHistory, organizationId } = await req.json();
    if (!message) throw new Error("Message is required");

    // 1. Decide which tools to call
    // Example with OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.warn("OPENAI_API_KEY not found, using mock LLM fallback");
      return new Response(
        JSON.stringify({
          role: "assistant",
          content:
            "LLM is not configured yet! Please set OPENAI_API_KEY as an Edge Function secret.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build messages for OpenAI
    const systemPrompt = `
You are Introo OS AI Business Assistant, a helpful AI that helps users manage their business.
You can use tools to interact with data in your organization.
When you need information, call the appropriate tool!
`;

    // 2. Call OpenAI with tool-calling model
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Or gpt-3.5-turbo
          messages: [
            { role: "system", content: systemPrompt },
            ...(conversationHistory || []),
            { role: "user", content: message },
          ],
          tools: allTools,
        }),
      },
    );
    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI error:", error);
      throw new Error(error);
    }

    const openaiData = await openaiResponse.json();

    // 3. Handle tool calls (if any)
    let assistantMessage = openaiData.choices[0].message;
    if (assistantMessage.tool_calls?.length) {
      const toolCalls = assistantMessage.tool_calls;
      const toolResults = [];
      for (const call of toolCalls) {
        const functionName = call.function.name;
        const functionArgs = JSON.parse(call.function.arguments);

        let result;
        // Execute tool call based on name
        if (functionName === "get_all_clients") {
          const { data, error } = await supabaseClient
            .from("clients")
            .select("*")
            .eq("organization_id", organizationId);
          if (error) throw error;
          result = data;
        } else if (functionName === "get_all_projects") {
          const { data, error } = await supabaseClient
            .from("projects")
            .select("*")
            .eq("organization_id", organizationId);
          if (error) throw error;
          result = data;
        } else if (functionName === "get_all_tasks") {
          const { data, error } = await supabaseClient
            .from("tasks")
            .select("*")
            .eq("organization_id", organizationId);
          if (error) throw error;
          result = data;
        }

        toolResults.push({
          tool_call_id: call.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result),
        });
      }

      // Get final response from OpenAI with tool results
      const secondResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              ...(conversationHistory || []),
              { role: "user", content: message },
              assistantMessage,
              ...toolResults,
            ],
          }),
        },
      );
      const secondData = await secondResponse.json();
      assistantMessage = secondData.choices[0].message;
    }

    // 4. Return response back to frontend
    return new Response(JSON.stringify(assistantMessage), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
