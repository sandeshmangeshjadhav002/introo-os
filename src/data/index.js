export const leadsData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'New', source: 'Website', value: 5000 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Contacted', source: 'Referral', value: 8000 },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Qualified', source: 'LinkedIn', value: 12000 },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', status: 'Proposal', source: 'Ad Campaign', value: 6500 },
  { id: 5, name: 'David Brown', email: 'david@example.com', status: 'Closed Won', source: 'Website', value: 15000 },
]

export const customersData = [
  { id: 1, name: 'Acme Corp', email: 'info@acme.com', phone: '555-1234', status: 'Active', revenue: 50000 },
  { id: 2, name: 'Tech Solutions', email: 'hello@techsol.com', phone: '555-5678', status: 'Active', revenue: 75000 },
  { id: 3, name: 'Global Inc', email: 'contact@global.com', phone: '555-9012', status: 'Inactive', revenue: 30000 },
  { id: 4, name: 'Startup XYZ', email: 'team@startupxyz.com', phone: '555-3456', status: 'Active', revenue: 45000 },
]

export const pipelineData = {
  'New Leads': [
    { id: 't1', title: 'New Lead from Website', description: 'Interested in our SaaS solution', assignee: 'John', priority: 'High' }
  ],
  'Contacted': [
    { id: 't2', title: 'Follow up with Acme Corp', description: 'Send pricing details', assignee: 'Jane', priority: 'Medium' }
  ],
  'Qualified': [
    { id: 't3', title: 'Demo scheduled', description: 'Product demo next week', assignee: 'Mike', priority: 'High' }
  ],
  'Proposal': [
    { id: 't4', title: 'Proposal review', description: 'Waiting for client feedback', assignee: 'Sarah', priority: 'Low' }
  ],
  'Closed': [
    { id: 't5', title: 'Contract signed', description: 'Deal closed successfully', assignee: 'David', priority: 'Medium' }
  ],
}

export const projectData = {
  'To Do': [
    { id: 'p1', title: 'Design mockups', description: 'Create UI designs', assignee: 'Alex', dueDate: '2026-06-28' }
  ],
  'In Progress': [
    { id: 'p2', title: 'Frontend development', description: 'Build React components', assignee: 'Ben', dueDate: '2026-06-30' },
    { id: 'p3', title: 'API integration', description: 'Connect to backend', assignee: 'Chris', dueDate: '2026-07-02' }
  ],
  'Review': [
    { id: 'p4', title: 'Code review', description: 'Review pull requests', assignee: 'Diana', dueDate: '2026-06-27' }
  ],
  'Done': [
    { id: 'p5', title: 'Project setup', description: 'Initialize repository', assignee: 'Ethan', dueDate: '2026-06-24' }
  ],
}

export const teamMembers = [
  { id: 1, name: 'Alex Johnson', role: 'Product Manager', email: 'alex@introo.com', status: 'Online' },
  { id: 2, name: 'Ben Smith', role: 'Frontend Developer', email: 'ben@introo.com', status: 'Online' },
  { id: 3, name: 'Chris Lee', role: 'Backend Developer', email: 'chris@introo.com', status: 'Away' },
  { id: 4, name: 'Diana Wang', role: 'UX Designer', email: 'diana@introo.com', status: 'Offline' },
  { id: 5, name: 'Ethan Brown', role: 'QA Engineer', email: 'ethan@introo.com', status: 'Online' },
]

export const channels = [
  { id: 1, name: 'general', type: 'public' },
  { id: 2, name: 'engineering', type: 'public' },
  { id: 3, name: 'design', type: 'public' },
  { id: 4, name: 'marketing', type: 'private' },
  { id: 5, name: 'sales', type: 'private' },
]

export const messages = [
  { id: 1, user: 'Alex Johnson', content: 'Hey everyone! Welcome to Introo OS!', time: '9:00 AM', avatar: 'https://i.pravatar.cc/40?img=1' },
  { id: 2, user: 'Ben Smith', content: 'Thanks! Excited to be here.', time: '9:05 AM', avatar: 'https://i.pravatar.cc/40?img=2' },
  { id: 3, user: 'Chris Lee', content: 'Let\'s build something amazing!', time: '9:10 AM', avatar: 'https://i.pravatar.cc/40?img=3' },
]

export const calendarEvents = [
  { id: 1, title: 'Team Meeting', date: '2026-06-26', time: '10:00 AM - 11:00 AM', type: 'meeting' },
  { id: 2, title: 'Project Review', date: '2026-06-27', time: '2:00 PM - 3:00 PM', type: 'review' },
  { id: 3, title: 'Client Call', date: '2026-06-28', time: '11:00 AM - 12:00 PM', type: 'call' },
]

export const documents = [
  { id: 1, name: 'Project Proposal', type: 'pdf', date: '2026-06-20', size: '2.5 MB' },
  { id: 2, name: 'Q2 Report', type: 'xlsx', date: '2026-06-22', size: '1.2 MB' },
  { id: 3, name: 'Design Mockups', type: 'png', date: '2026-06-24', size: '5.8 MB' },
  { id: 4, name: 'Meeting Notes', type: 'docx', date: '2026-06-25', size: '350 KB' },
]

export const employees = [
  { id: 1, name: 'Alice Cooper', role: 'Software Engineer', department: 'Engineering', email: 'alice@introo.com', phone: '555-1111', joinDate: '2024-01-15' },
  { id: 2, name: 'Bob Marley', role: 'Marketing Manager', department: 'Marketing', email: 'bob@introo.com', phone: '555-2222', joinDate: '2023-06-20' },
  { id: 3, name: 'Charlie Brown', role: 'HR Specialist', department: 'Human Resources', email: 'charlie@introo.com', phone: '555-3333', joinDate: '2023-11-05' },
]

export const attendance = [
  { id: 1, name: 'Alice Cooper', date: '2026-06-25', status: 'Present', checkIn: '9:00 AM', checkOut: '6:00 PM' },
  { id: 2, name: 'Bob Marley', date: '2026-06-25', status: 'Present', checkIn: '8:45 AM', checkOut: '5:30 PM' },
  { id: 3, name: 'Charlie Brown', date: '2026-06-25', status: 'On Leave', checkIn: '-', checkOut: '-' },
]

export const leaveRequests = [
  { id: 1, name: 'David Miller', type: 'Vacation', from: '2026-07-01', to: '2026-07-05', status: 'Approved' },
  { id: 2, name: 'Eva Green', type: 'Sick Leave', from: '2026-06-26', to: '2026-06-27', status: 'Pending' },
]

export const invoices = [
  { id: 1, number: 'INV-001', client: 'Acme Corp', amount: 5000, status: 'Paid', date: '2026-06-15' },
  { id: 2, number: 'INV-002', client: 'Tech Solutions', amount: 8000, status: 'Pending', date: '2026-06-20' },
  { id: 3, number: 'INV-003', client: 'Global Inc', amount: 3000, status: 'Overdue', date: '2026-06-10' },
]

export const expenses = [
  { id: 1, description: 'Office Supplies', amount: 150, category: 'Office', date: '2026-06-20' },
  { id: 2, description: 'Business Lunch', amount: 85, category: 'Food', date: '2026-06-22' },
  { id: 3, description: 'Software Subscription', amount: 299, category: 'Software', date: '2026-06-24' },
]

export const adminUsers = [
  { id: 1, name: 'Admin User', email: 'admin@introo.com', role: 'Super Admin', status: 'Active', lastLogin: '2026-06-25' },
  { id: 2, name: 'Manager User', email: 'manager@introo.com', role: 'Manager', status: 'Active', lastLogin: '2026-06-24' },
  { id: 3, name: 'Test User', email: 'test@introo.com', role: 'User', status: 'Inactive', lastLogin: '2026-06-20' },
]

export const revenueData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 },
  { month: 'May', revenue: 6000 },
  { month: 'Jun', revenue: 5500 },
]

export const activityFeed = [
  { id: 1, user: 'Alex', action: 'created a new lead', time: '5 min ago' },
  { id: 2, user: 'Ben', action: 'completed a task', time: '15 min ago' },
  { id: 3, user: 'Chris', action: 'sent an invoice', time: '1 hour ago' },
  { id: 4, user: 'Diana', action: 'uploaded a document', time: '2 hours ago' },
]

export const testimonials = [
  { id: 1, name: 'Sarah Johnson', role: 'CEO, TechCorp', content: 'Introo OS has transformed how we run our business. Everything in one place!' },
  { id: 2, name: 'Mike Chen', role: 'CTO, StartupXYZ', content: 'The best all-in-one solution we\'ve ever used. Highly recommend!' },
  { id: 3, name: 'Emily Davis', role: 'Founder, GlobalBiz', content: 'Incredible features and amazing support. Our team loves it!' },
]

export const pricingPlans = [
  { id: 1, name: 'Starter', price: 29, features: ['5 Users', 'Basic CRM', 'Project Management', 'Email Support'] },
  { id: 2, name: 'Professional', price: 79, features: ['20 Users', 'Full CRM', 'Advanced Analytics', 'Priority Support'], popular: true },
  { id: 3, name: 'Enterprise', price: 199, features: ['Unlimited Users', 'Custom Integrations', 'Dedicated Account Manager', '24/7 Support'] },
]

export const faqs = [
  { id: 1, question: 'What is Introo OS?', answer: 'Introo OS is an all-in-one business operating system that combines CRM, project management, team collaboration, and more in a single platform.' },
  { id: 2, question: 'Can I try it for free?', answer: 'Yes! We offer a 14-day free trial with no credit card required.' },
  { id: 3, question: 'Is there a mobile app?', answer: 'Currently we offer a responsive web app that works perfectly on all devices, and native mobile apps are coming soon.' },
  { id: 4, question: 'How secure is my data?', answer: 'We use industry-standard encryption and security practices to keep your data safe and secure.' },
]
