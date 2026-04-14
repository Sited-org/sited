
UPDATE public.project_sitemaps
SET sections = '[
  {
    "title": "Admin Portal",
    "pages": [
      {"name": "Login", "nodeType": "page"},
      {"name": "Dashboard", "nodeType": "page", "children": [
        {"name": "Overview Widgets", "nodeType": "note"},
        {"name": "Recent Activity", "nodeType": "note"},
        {"name": "Quick Actions", "nodeType": "note"}
      ]},
      {"name": "Leads / CRM", "nodeType": "page", "children": [
        {"name": "Leads Table", "nodeType": "note"},
        {"name": "Lead Profile", "nodeType": "page", "tabs": [
          {"name": "Profile", "nodeType": "tab"},
          {"name": "Project", "nodeType": "tab"},
          {"name": "Communications", "nodeType": "tab"},
          {"name": "Billing", "nodeType": "tab"}
        ]},
        {"name": "Lead Filters", "nodeType": "popup"}
      ]},
      {"name": "Team / Users", "nodeType": "page", "children": [
        {"name": "Users Table", "nodeType": "note"},
        {"name": "Invite User", "nodeType": "popup"},
        {"name": "Role Management", "nodeType": "tab"}
      ]},
      {"name": "Financial", "nodeType": "page", "children": [
        {"name": "Transactions Table", "nodeType": "note"},
        {"name": "Create Invoice", "nodeType": "popup"},
        {"name": "Invoice Detail", "nodeType": "page"}
      ]},
      {"name": "Calendar", "nodeType": "page", "children": [
        {"name": "Calendar View", "nodeType": "note"},
        {"name": "Booking Detail", "nodeType": "popup"},
        {"name": "Settings", "nodeType": "tab"}
      ]},
      {"name": "Analytics", "nodeType": "page", "children": [
        {"name": "Charts", "nodeType": "note"},
        {"name": "Date Range Filter", "nodeType": "popup"}
      ]},
      {"name": "Content Manager", "nodeType": "page", "children": [
        {"name": "Pages List", "nodeType": "note"},
        {"name": "Editor", "nodeType": "page"}
      ]},
      {"name": "Notifications", "nodeType": "page", "children": [
        {"name": "Email", "nodeType": "note"},
        {"name": "Push", "nodeType": "note"},
        {"name": "SMS", "nodeType": "note"}
      ]},
      {"name": "Settings", "nodeType": "page", "children": [
        {"name": "General", "nodeType": "tab"},
        {"name": "Security", "nodeType": "tab"},
        {"name": "Integrations", "nodeType": "tab"}
      ]}
    ]
  },
  {
    "title": "Client Portal",
    "pages": [
      {"name": "Login", "nodeType": "page"},
      {"name": "Dashboard", "nodeType": "page", "children": [
        {"name": "Project Progress", "nodeType": "note"},
        {"name": "Recent Updates", "nodeType": "note"},
        {"name": "Quick Actions", "nodeType": "note"}
      ]},
      {"name": "Project Tracker", "nodeType": "page", "children": [
        {"name": "Phase View", "nodeType": "note"},
        {"name": "Milestone Detail", "nodeType": "popup"}
      ]},
      {"name": "Invoices & Payments", "nodeType": "page", "children": [
        {"name": "Invoice List", "nodeType": "note"},
        {"name": "Pay Now", "nodeType": "popup"},
        {"name": "Receipt", "nodeType": "popup"}
      ]},
      {"name": "Requests", "nodeType": "page", "children": [
        {"name": "Request List", "nodeType": "note"},
        {"name": "New Request", "nodeType": "popup"},
        {"name": "Request Detail", "nodeType": "page"}
      ]},
      {"name": "Files & Uploads", "nodeType": "page", "children": [
        {"name": "File Grid", "nodeType": "note"},
        {"name": "Upload", "nodeType": "popup"}
      ]},
      {"name": "Messages", "nodeType": "page", "children": [
        {"name": "Conversation Thread", "nodeType": "note"},
        {"name": "New Message", "nodeType": "popup"}
      ]},
      {"name": "My Account", "nodeType": "page", "children": [
        {"name": "Profile", "nodeType": "tab"},
        {"name": "Password", "nodeType": "tab"},
        {"name": "Notifications", "nodeType": "tab"}
      ]}
    ]
  },
  {
    "title": "Staff Portal",
    "pages": [
      {"name": "Login", "nodeType": "page"},
      {"name": "Dashboard", "nodeType": "page", "children": [
        {"name": "My Tasks", "nodeType": "note"},
        {"name": "Team Overview", "nodeType": "note"}
      ]},
      {"name": "Task Management", "nodeType": "page", "children": [
        {"name": "Task Board", "nodeType": "note"},
        {"name": "Kanban View", "nodeType": "tab"},
        {"name": "List View", "nodeType": "tab"}
      ]},
      {"name": "Schedule", "nodeType": "page", "children": [
        {"name": "Weekly View", "nodeType": "tab"},
        {"name": "Monthly View", "nodeType": "tab"}
      ]},
      {"name": "Projects", "nodeType": "page", "children": [
        {"name": "Assigned Projects", "nodeType": "note"},
        {"name": "Project Detail", "nodeType": "page"}
      ]},
      {"name": "Time Tracking", "nodeType": "page", "children": [
        {"name": "Log Hours", "nodeType": "popup"},
        {"name": "Timesheet", "nodeType": "note"}
      ]},
      {"name": "Role Access", "nodeType": "note", "children": [
        {"name": "Admin", "nodeType": "note"},
        {"name": "Manager", "nodeType": "note"},
        {"name": "Member", "nodeType": "note"}
      ]},
      {"name": "My Profile", "nodeType": "page"}
    ]
  },
  {
    "title": "Sales Funnel",
    "pages": [
      {"name": "Landing Page", "nodeType": "page", "children": [
        {"name": "Hero + Value Prop", "nodeType": "note"},
        {"name": "Social Proof", "nodeType": "note"},
        {"name": "CTA Banner", "nodeType": "note"}
      ]},
      {"name": "Lead Capture", "nodeType": "popup", "children": [
        {"name": "Form Fields", "nodeType": "note"},
        {"name": "Validation", "nodeType": "note"}
      ]},
      {"name": "Thank You", "nodeType": "page", "children": [
        {"name": "Confirmation Message", "nodeType": "note"},
        {"name": "Next Steps", "nodeType": "note"}
      ]},
      {"name": "Follow Up", "nodeType": "page", "children": [
        {"name": "Email Sequence", "nodeType": "tab"},
        {"name": "Retargeting", "nodeType": "tab"}
      ]},
      {"name": "Offer Page", "nodeType": "page", "children": [
        {"name": "Pricing Tiers", "nodeType": "note"},
        {"name": "Feature Comparison", "nodeType": "note"},
        {"name": "Checkout", "nodeType": "popup"}
      ]},
      {"name": "Upsell", "nodeType": "popup", "children": [
        {"name": "Cross-sell Items", "nodeType": "note"},
        {"name": "Discount Timer", "nodeType": "note"}
      ]}
    ]
  }
]'::jsonb,
updated_at = now()
WHERE is_web_builder = true;
