// ALL Introo OS Tools
export const allTools = [
  // ========================
  // CRM TOOLS
  // ========================
  {
    name: "get_all_clients",
    description: "Get all clients in the organization",
    schema: {},
  },
  {
    name: "get_client_by_id",
    description: "Get a specific client by ID",
    schema: { id: "number" },
  },
  {
    name: "create_client",
    description: "Create a new client in CRM",
    schema: {
      company_name: "string",
      email: "string",
      phone: "string",
      industry: "string",
    },
  },
  {
    name: "update_client",
    description: "Update an existing client",
    schema: {
      id: "number",
      company_name: "string",
      email: "string",
      phone: "string",
    },
  },
  {
    name: "delete_client",
    description: "Delete a client by ID",
    schema: { id: "number" },
  },

  {
    name: "get_all_contacts",
    description: "Get all contacts in the organization",
    schema: {},
  },
  {
    name: "create_contact",
    description: "Create a new contact for a client",
    schema: {
      first_name: "string",
      last_name: "string",
      email: "string",
      client_id: "number",
    },
  },

  {
    name: "get_all_deals",
    description: "Get all deals in the organization",
    schema: {},
  },
  {
    name: "create_deal",
    description: "Create a new deal",
    schema: {
      name: "string",
      amount: "number",
      stage: "string",
      client_id: "number",
    },
  },

  // ========================
  // PROJECT MANAGEMENT TOOLS
  // ========================
  {
    name: "get_all_projects",
    description: "Get all projects",
    schema: {},
  },
  {
    name: "get_project_by_id",
    description: "Get project details by ID",
    schema: { id: "number" },
  },
  {
    name: "create_project",
    description: "Create a new project",
    schema: {
      name: "string",
      description: "string",
      status: "string",
      due_date: "string",
    },
  },

  {
    name: "get_all_tasks",
    description: "Get all tasks",
    schema: {},
  },
  {
    name: "get_tasks_by_project",
    description: "Get tasks for a specific project",
    schema: { project_id: "number" },
  },
  {
    name: "create_task",
    description: "Create a new task",
    schema: {
      title: "string",
      description: "string",
      status: "string",
      priority: "string",
      project_id: "number",
    },
  },
  {
    name: "update_task_status",
    description: "Update task status (todo, in_progress, done)",
    schema: { id: "number", status: "string" },
  },

  {
    name: "get_all_milestones",
    description: "Get all milestones",
    schema: {},
  },
  {
    name: "get_all_sprints",
    description: "Get all sprints",
    schema: {},
  },

  // ========================
  // HR TOOLS
  // ========================
  {
    name: "get_all_employees",
    description: "Get all employees",
    schema: {},
  },
  {
    name: "create_employee",
    description: "Create a new employee",
    schema: {
      first_name: "string",
      last_name: "string",
      email: "string",
      position: "string",
      department: "string",
    },
  },

  // ========================
  // FINANCE TOOLS
  // ========================
  {
    name: "get_all_invoices",
    description: "Get all invoices",
    schema: {},
  },
  {
    name: "get_all_expenses",
    description: "Get all expenses",
    schema: {},
  },
  {
    name: "create_invoice",
    description: "Create a new invoice",
    schema: { client_id: "number", amount: "number", due_date: "string" },
  },

  // ========================
  // GENERAL UTILITY TOOLS
  // ========================
  {
    name: "get_workspace_summary",
    description: "Get overall stats for your Introo OS workspace",
    schema: {},
  },
];

// Mock implementation of all tools (for testing)
export const executeTool = async (
  toolName,
  params,
  { supabase, organizationId },
) => {
  // Mock data (will use real Supabase when connected)
  const MOCK = {
    clients: [
      {
        id: 1,
        company_name: "Acme Corp",
        email: "contact@acme.com",
        phone: "+1-555-123-4567",
        industry: "Technology",
      },
      {
        id: 2,
        company_name: "Globex Inc.",
        email: "info@globex.com",
        phone: "+1-555-987-6543",
        industry: "Finance",
      },
      {
        id: 3,
        company_name: "Tech Solutions Ltd.",
        email: "hello@techsolutions.com",
        phone: "+1-555-456-7890",
        industry: "Consulting",
      },
    ],
    contacts: [
      {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@acme.com",
        client_id: 1,
      },
      {
        id: 2,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@globex.com",
        client_id: 2,
      },
    ],
    deals: [
      {
        id: 1,
        name: "Website Redesign",
        amount: 15000,
        stage: "in_progress",
        client_id: 1,
      },
      {
        id: 2,
        name: "Mobile App",
        amount: 45000,
        stage: "negotiation",
        client_id: 2,
      },
    ],
    projects: [
      {
        id: 1,
        name: "Website Redesign",
        status: "in_progress",
        due_date: "2026-08-15",
        description: "Complete overhaul of client website",
      },
      {
        id: 2,
        name: "Mobile App Development",
        status: "planning",
        due_date: "2026-09-30",
        description: "iOS and Android app",
      },
      {
        id: 3,
        name: "Q4 Marketing Campaign",
        status: "completed",
        due_date: "2026-06-30",
        description: "Holiday marketing push",
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Design homepage",
        status: "done",
        priority: "high",
        project_id: 1,
        description: "New hero section and layout",
      },
      {
        id: 2,
        title: "Set up analytics",
        status: "in_progress",
        priority: "medium",
        project_id: 1,
        description: "Integrate GA4",
      },
      {
        id: 3,
        title: "Test checkout flow",
        status: "todo",
        priority: "high",
        project_id: 1,
        description: "End-to-end checkout",
      },
      {
        id: 4,
        title: "Write user documentation",
        status: "todo",
        priority: "low",
        project_id: 2,
        description: "User guide for app",
      },
    ],
    milestones: [
      {
        id: 1,
        name: "Design Complete",
        project_id: 1,
        due_date: "2026-07-15",
        status: "completed",
      },
      {
        id: 2,
        name: "Alpha Launch",
        project_id: 2,
        due_date: "2026-08-01",
        status: "in_progress",
      },
    ],
    sprints: [
      {
        id: 1,
        name: "Sprint 1 - Foundation",
        start_date: "2026-07-01",
        end_date: "2026-07-15",
        status: "active",
      },
      {
        id: 2,
        name: "Sprint 2 - Features",
        start_date: "2026-07-16",
        end_date: "2026-07-30",
        status: "upcoming",
      },
    ],
    employees: [
      {
        id: 1,
        first_name: "Alice",
        last_name: "Johnson",
        email: "alice@introo.com",
        position: "Product Manager",
        department: "Product",
      },
      {
        id: 2,
        first_name: "Bob",
        last_name: "Williams",
        email: "bob@introo.com",
        position: "Senior Developer",
        department: "Engineering",
      },
      {
        id: 3,
        first_name: "Charlie",
        last_name: "Brown",
        email: "charlie@introo.com",
        position: "UX Designer",
        department: "Design",
      },
    ],
    invoices: [
      {
        id: 1,
        client_id: 1,
        amount: 15000,
        due_date: "2026-07-30",
        status: "sent",
      },
      {
        id: 2,
        client_id: 2,
        amount: 45000,
        due_date: "2026-08-15",
        status: "draft",
      },
    ],
    expenses: [
      {
        id: 1,
        description: "Software subscriptions",
        amount: 500,
        date: "2026-07-01",
      },
      { id: 2, description: "Team lunch", amount: 120, date: "2026-07-05" },
    ],
  };

  try {
    // First try real Supabase, but fall back to mock
    switch (toolName) {
      // CRM
      case "get_all_clients":
        return { data: MOCK.clients, error: null };
      case "create_client":
        const newClient = { id: MOCK.clients.length + 1, ...params };
        MOCK.clients.push(newClient);
        return { data: newClient, error: null };
      case "get_all_contacts":
        return { data: MOCK.contacts, error: null };
      case "create_contact":
        const newContact = { id: MOCK.contacts.length + 1, ...params };
        MOCK.contacts.push(newContact);
        return { data: newContact, error: null };
      case "get_all_deals":
        return { data: MOCK.deals, error: null };
      case "create_deal":
        const newDeal = { id: MOCK.deals.length + 1, ...params };
        MOCK.deals.push(newDeal);
        return { data: newDeal, error: null };

      // PROJECTS
      case "get_all_projects":
        return { data: MOCK.projects, error: null };
      case "create_project":
        const newProject = { id: MOCK.projects.length + 1, ...params };
        MOCK.projects.push(newProject);
        return { data: newProject, error: null };

      // TASKS
      case "get_all_tasks":
        return { data: MOCK.tasks, error: null };
      case "get_tasks_by_project":
        return {
          data: MOCK.tasks.filter((t) => t.project_id === params.project_id),
          error: null,
        };
      case "create_task":
        const newTask = { id: MOCK.tasks.length + 1, ...params };
        MOCK.tasks.push(newTask);
        return { data: newTask, error: null };
      case "update_task_status":
        const taskIdx = MOCK.tasks.findIndex((t) => t.id === params.id);
        if (taskIdx !== -1) {
          MOCK.tasks[taskIdx].status = params.status;
          return { data: MOCK.tasks[taskIdx], error: null };
        }
        return { data: null, error: "Task not found" };

      // MILESTONES & SPRINTS
      case "get_all_milestones":
        return { data: MOCK.milestones, error: null };
      case "get_all_sprints":
        return { data: MOCK.sprints, error: null };

      // HR
      case "get_all_employees":
        return { data: MOCK.employees, error: null };
      case "create_employee":
        const newEmp = { id: MOCK.employees.length + 1, ...params };
        MOCK.employees.push(newEmp);
        return { data: newEmp, error: null };

      // FINANCE
      case "get_all_invoices":
        return { data: MOCK.invoices, error: null };
      case "get_all_expenses":
        return { data: MOCK.expenses, error: null };
      case "create_invoice":
        const newInv = {
          id: MOCK.invoices.length + 1,
          status: "draft",
          ...params,
        };
        MOCK.invoices.push(newInv);
        return { data: newInv, error: null };

      // SUMMARY
      case "get_workspace_summary":
        return {
          data: {
            total_clients: MOCK.clients.length,
            active_projects: MOCK.projects.filter(
              (p) => p.status === "in_progress",
            ).length,
            pending_tasks: MOCK.tasks.filter((t) => t.status !== "done").length,
            total_revenue: MOCK.invoices.reduce(
              (sum, inv) => sum + inv.amount,
              0,
            ),
            active_employees: MOCK.employees.length,
          },
          error: null,
        };

      default:
        return { data: null, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};
