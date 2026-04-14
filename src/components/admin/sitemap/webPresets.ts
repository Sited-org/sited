// Pre-built web templates using the same SitemapPage structure

export interface WebPreset {
  id: string;
  name: string;
  description: string;
  pages: any[]; // SitemapPage[]
}

export const WEB_PRESETS: WebPreset[] = [
  {
    id: 'sales-funnel',
    name: 'Sales Funnel',
    description: 'Landing page → lead capture → thank you → follow-up',
    pages: [
      { name: 'Landing Page', nodeType: 'page' },
      {
        name: 'Lead Capture',
        nodeType: 'popup',
        children: [
          { name: 'Form Submission', nodeType: 'page' },
        ],
      },
      { name: 'Thank You', nodeType: 'page' },
      {
        name: 'Follow Up',
        nodeType: 'page',
        children: [
          { name: 'Email Sequence', nodeType: 'tab' },
          { name: 'Retargeting', nodeType: 'tab' },
        ],
      },
    ],
  },
  {
    id: 'user-profile',
    name: 'User Profile Area',
    description: 'Profile, settings, activity log',
    pages: [
      { name: 'Profile', nodeType: 'page' },
      {
        name: 'Settings',
        nodeType: 'page',
        children: [
          { name: 'Account', nodeType: 'tab' },
          { name: 'Security', nodeType: 'tab' },
          { name: 'Notifications', nodeType: 'tab' },
        ],
      },
      { name: 'Activity Log', nodeType: 'page' },
    ],
  },
  {
    id: 'blog-section',
    name: 'Blog Section',
    description: 'Blog index, post, categories, author page',
    pages: [
      {
        name: 'Blog Index',
        nodeType: 'page',
        children: [
          { name: 'Search', nodeType: 'tab' },
          { name: 'Filters', nodeType: 'tab' },
        ],
      },
      { name: 'Blog Post', nodeType: 'page' },
      { name: 'Categories', nodeType: 'page' },
      { name: 'Author Page', nodeType: 'page' },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Products → cart → checkout → confirmation',
    pages: [
      { name: 'Products', nodeType: 'page' },
      { name: 'Product Detail', nodeType: 'page' },
      { name: 'Cart', nodeType: 'page' },
      {
        name: 'Checkout',
        nodeType: 'page',
        children: [
          { name: 'Shipping', nodeType: 'tab' },
          { name: 'Payment', nodeType: 'tab' },
          { name: 'Review', nodeType: 'tab' },
        ],
      },
      { name: 'Order Confirmation', nodeType: 'page' },
    ],
  },
  {
    id: 'auth-flow',
    name: 'Auth Flow',
    description: 'Login, register, password reset, verification',
    pages: [
      { name: 'Login', nodeType: 'page' },
      { name: 'Register', nodeType: 'page' },
      { name: 'Forgot Password', nodeType: 'popup' },
      { name: 'Reset Password', nodeType: 'page' },
      { name: 'Email Verification', nodeType: 'page' },
    ],
  },
  {
    id: 'support-center',
    name: 'Support Center',
    description: 'Help center, FAQ, contact, ticket system',
    pages: [
      { name: 'Help Center', nodeType: 'page' },
      { name: 'FAQ', nodeType: 'page' },
      { name: 'Contact', nodeType: 'page' },
      {
        name: 'Ticket System',
        nodeType: 'page',
        children: [
          { name: 'Open Tickets', nodeType: 'tab' },
          { name: 'Resolved', nodeType: 'tab' },
        ],
      },
    ],
  },
];
