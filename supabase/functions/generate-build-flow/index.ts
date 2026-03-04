import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PhaseConfig {
  phase_number: number;
  phase_key: string;
  title: string;
  description: string;
  is_locked: boolean;
  is_strictly_linear: boolean;
  unlocks_after_phase_key: string | null;
  steps: StepConfig[];
  condition?: (ctx: BuildContext) => boolean;
}

interface StepConfig {
  step_number: number;
  step_key: string;
  title: string;
  description: string;
  guidance: string;
  is_required: boolean;
  condition?: (ctx: BuildContext) => boolean;
}

interface BuildContext {
  project_type: string;
  selected_features: string[];
  selected_pages: string[];
  selected_integrations: string[];
}

function hasFeature(ctx: BuildContext, f: string) {
  return ctx.selected_features.includes(f) || ctx.selected_integrations.includes(f);
}

function hasBackend(ctx: BuildContext) {
  return (
    ["ecommerce", "webapp", "booking"].includes(ctx.project_type) ||
    hasFeature(ctx, "user_signup_login") ||
    hasFeature(ctx, "contact_form_db") ||
    hasFeature(ctx, "user_data_storage") ||
    hasFeature(ctx, "content_management") ||
    hasFeature(ctx, "file_uploads") ||
    hasFeature(ctx, "stripe_one_time") ||
    hasFeature(ctx, "stripe_subscriptions")
  );
}

function generatePhases(ctx: BuildContext): PhaseConfig[] {
  const phases: PhaseConfig[] = [];

  // PHASE 1 — Onboarding & Discovery
  phases.push({
    phase_number: 1, phase_key: "onboarding",
    title: "Onboarding & Discovery",
    description: "Initial client onboarding, proposal, contract, and site map approval.",
    is_locked: false, is_strictly_linear: false, unlocks_after_phase_key: null,
    steps: [
      { step_number: 1, step_key: "discovery_call", title: "Discovery call completed & notes saved", description: "Complete the discovery call with the client.", guidance: "Record key takeaways, goals, and any specific requests from the client.", is_required: true },
      { step_number: 2, step_key: "proposal_sent", title: "Proposal sent to client", description: "Send the project proposal.", guidance: "Include scope, timeline, pricing, and deliverables.", is_required: true },
      { step_number: 3, step_key: "contract_signed", title: "Contract signed — attach signed copy", description: "Get the contract signed.", guidance: "Upload the signed contract as a screenshot or PDF.", is_required: true },
      { step_number: 4, step_key: "deposit_received", title: "Deposit received — confirm amount", description: "Confirm the deposit payment has been received.", guidance: "Note the amount received and payment method.", is_required: true },
      { step_number: 5, step_key: "client_profile_created", title: "Client profile fully created in Sited", description: "Create the client profile.", guidance: "Ensure all contact details, business info, and notes are saved.", is_required: true },
      { step_number: 6, step_key: "sitemap_drafted", title: "Site map drafted and sent to client", description: "Draft and send the site map.", guidance: "List all pages, their hierarchy, and key sections.", is_required: true },
      { step_number: 7, step_key: "sitemap_approved", title: "Site map approved by client in writing — attach approval", description: "Get written approval.", guidance: "Upload screenshot of client approval (email, message, or signed document).", is_required: true },
    ],
  });

  // PHASE 2 — Asset Collection
  phases.push({
    phase_number: 2, phase_key: "assets",
    title: "Asset Collection",
    description: "Collect all brand assets, logos, colours, fonts, and media.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "onboarding",
    steps: [
      { step_number: 1, step_key: "logo_512", title: "Logo 512x512 uploaded", description: "Upload the main app icon.", guidance: "PNG format, transparent background preferred.", is_required: true },
      { step_number: 2, step_key: "logo_192", title: "Logo 192x192 uploaded", description: "Upload the PWA icon.", guidance: "PNG format, 192x192 pixels.", is_required: true },
      { step_number: 3, step_key: "logo_32", title: "Logo 32x32 uploaded", description: "Upload the favicon.", guidance: "PNG format, 32x32 pixels. Used in browser tabs.", is_required: true },
      { step_number: 4, step_key: "logo_16", title: "Logo 16x16 uploaded", description: "Upload the small favicon.", guidance: "PNG format, 16x16 pixels.", is_required: true },
      { step_number: 5, step_key: "logo_apple_touch", title: "Apple Touch Icon 180x180 uploaded", description: "Upload the Apple touch icon.", guidance: "PNG format, 180x180 pixels. Used when saving to iOS home screen.", is_required: true },
      { step_number: 6, step_key: "og_image", title: "OG Image 1200x630 uploaded", description: "Upload the social sharing image.", guidance: "Used when the website is shared on social media. 1200x630 pixels.", is_required: true },
      { step_number: 7, step_key: "brand_colours", title: "Brand colours added (minimum 1 colour entry)", description: "Add brand colours.", guidance: "Add at least the primary brand colour. Hex values required.", is_required: true },
      { step_number: 8, step_key: "brand_fonts", title: "Brand fonts added (minimum 1 font entry)", description: "Add brand fonts.", guidance: "Specify heading and body fonts. Use Google Fonts names.", is_required: true },
      { step_number: 9, step_key: "gdrive_link", title: "Google Drive media folder link saved", description: "Save the media folder link.", guidance: "Paste the shared Google Drive link containing all client media.", is_required: true },
      { step_number: 10, step_key: "assets_confirmed", title: "Client confirms all assets are final", description: "Get client confirmation.", guidance: "Confirm the client has provided all final assets and no changes are expected.", is_required: true },
    ],
  });

  // PHASE 3 — Front End Build
  const frontendSteps: StepConfig[] = [
    { step_number: 1, step_key: "lovable_created", title: "Lovable project created", description: "Create the Lovable project.", guidance: "Create a new project in Lovable for this client.", is_required: true },
    { step_number: 2, step_key: "github_connected", title: "GitHub connected — repo created as [clientname]-website, Private", description: "Connect GitHub.", guidance: "In Lovable, click the GitHub icon and create a private repository named [clientname]-website.", is_required: true },
    { step_number: 3, step_key: "staging_url", title: "Staging URL set up: [businessname].sited.co", description: "Set up staging.", guidance: "Configure the staging URL and confirm it resolves.", is_required: true },
    { step_number: 4, step_key: "master_prompt", title: "Master build prompt written and submitted", description: "Write the build prompt.", guidance: "Create a comprehensive prompt covering all pages, features, and design requirements.", is_required: true },
    { step_number: 5, step_key: "homepage_built", title: "Homepage built and reviewed internally", description: "Build the homepage.", guidance: "Complete the homepage with hero, sections, CTAs, and correct content.", is_required: true },
  ];

  // Dynamic page steps
  let stepNum = 6;
  const pageList = ctx.selected_pages.length > 0 ? ctx.selected_pages : ["about", "services", "contact"];
  pageList.forEach((page) => {
    frontendSteps.push({
      step_number: stepNum++,
      step_key: `page_${page.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      title: `${page} page built`,
      description: `Build the ${page} page.`,
      guidance: `Complete all sections, content, and functionality for the ${page} page.`,
      is_required: true,
    });
  });

  const moreSteps: StepConfig[] = [
    { step_number: stepNum++, step_key: "navigation", title: "Navigation and all internal links working", description: "Test navigation.", guidance: "Check every link in header, footer, and within pages.", is_required: true },
    { step_number: stepNum++, step_key: "mobile_responsive", title: "Mobile responsiveness confirmed on all pages", description: "Test mobile.", guidance: "Test on iPhone, Android, and tablet viewports.", is_required: true },
    { step_number: stepNum++, step_key: "brand_applied", title: "Brand colours and fonts applied throughout", description: "Apply branding.", guidance: "Verify all colours and fonts match the brand guidelines.", is_required: true },
    { step_number: stepNum++, step_key: "placeholder_replaced", title: "All placeholder text replaced with real content", description: "Replace placeholders.", guidance: "Ensure no Lorem Ipsum or placeholder text remains.", is_required: true },
    { step_number: stepNum++, step_key: "media_placed", title: "All images and media placed correctly", description: "Place media.", guidance: "Use images from the client's Google Drive folder.", is_required: true },
    { step_number: stepNum++, step_key: "footer_built", title: "Footer built with correct links and legal pages", description: "Build footer.", guidance: "Include navigation links, legal pages, and contact info.", is_required: true },
    { step_number: stepNum++, step_key: "favicon_set", title: "Favicon set (use uploaded 32x32 logo)", description: "Set favicon.", guidance: "Use the 32x32 logo uploaded in Phase 2.", is_required: true },
    { step_number: stepNum++, step_key: "og_image_set", title: "OG image set for social sharing", description: "Set OG image.", guidance: "Use the 1200x630 OG image from Phase 2.", is_required: true },
    { step_number: stepNum++, step_key: "internal_qc", title: "Internal quality check completed — all items pass", description: "Run QC check.", guidance: "Review all pages for consistency, errors, and completeness.", is_required: true },
  ];

  frontendSteps.push(...moreSteps);

  phases.push({
    phase_number: 3, phase_key: "frontend",
    title: "Front End Build",
    description: "Build all pages, apply branding, and complete internal review.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "assets",
    steps: frontendSteps,
  });

  // PHASE 4 — Client Approval: Front End
  phases.push({
    phase_number: 4, phase_key: "approval_frontend",
    title: "Client Approval: Front End",
    description: "Share staging URL, collect feedback, and get written sign-off.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "frontend",
    steps: [
      { step_number: 1, step_key: "staging_shared", title: "Staging URL shared with client", description: "Share the staging URL.", guidance: "Send the [businessname].sited.co URL to the client.", is_required: true },
      { step_number: 2, step_key: "loom_walkthrough_fe", title: "Loom walkthrough recorded and sent", description: "Record a Loom.", guidance: "Walk through every page showing the design and functionality.", is_required: true },
      { step_number: 3, step_key: "feedback_form_sent", title: "Structured feedback form sent to client", description: "Send feedback form.", guidance: "Use the structured feedback template.", is_required: true },
      { step_number: 4, step_key: "round1_revisions", title: "Round 1 feedback received and revisions made", description: "Complete Round 1.", guidance: "Address all feedback items from the first round.", is_required: true },
      { step_number: 5, step_key: "round2_revisions", title: "Round 2 revisions (if needed, else skip)", description: "Complete Round 2 if needed.", guidance: "If a second round of revisions was needed, complete them here. Otherwise mark as skipped.", is_required: false },
      { step_number: 6, step_key: "fe_signoff", title: "Written sign-off received — attach proof", description: "Get sign-off.", guidance: "Upload screenshot of written approval from client.", is_required: true },
      { step_number: 7, step_key: "billable_notice", title: "Note: further changes are billable change requests", description: "Inform the client.", guidance: "Ensure the client understands that any further changes are billable.", is_required: true },
    ],
  });

  // PHASE 5 — Client Access & Credentials
  const credSteps: StepConfig[] = [
    { step_number: 1, step_key: "domain_access", title: "Domain registrar access — DNS confirmed", description: "Collect domain access.", guidance: "Get DNS management access specifically, not just account login. Save to vault.", is_required: true },
    { step_number: 2, step_key: "ga_access", title: "Google Analytics — Admin access confirmed", description: "Get GA access.", guidance: "Get invited as Admin to the GA4 property. Save Property ID to vault.", is_required: true },
  ];
  let credNum = 3;
  if (hasFeature(ctx, "stripe_one_time") || hasFeature(ctx, "stripe_subscriptions")) {
    credSteps.push({ step_number: credNum++, step_key: "stripe_test_keys", title: "Stripe test keys collected", description: "Collect Stripe test keys.", guidance: "Save publishable + secret test keys to vault.", is_required: true });
    credSteps.push({ step_number: credNum++, step_key: "stripe_live_keys", title: "Stripe live keys collected", description: "Collect Stripe live keys.", guidance: "Save publishable + secret live keys to vault. WARNING: Do not use until Phase 11.", is_required: true });
  }
  if (hasFeature(ctx, "email_marketing")) {
    credSteps.push({ step_number: credNum++, step_key: "email_marketing_key", title: "Email platform API key saved", description: "Collect email marketing credentials.", guidance: "Save API key and list/audience ID to vault.", is_required: true });
  }
  if (hasFeature(ctx, "transactional_email")) {
    credSteps.push({ step_number: credNum++, step_key: "transactional_email_key", title: "Transactional email API key saved", description: "Collect transactional email credentials.", guidance: "Save Resend/SendGrid API key and sending domain to vault.", is_required: true });
  }
  if (hasFeature(ctx, "calendly") || hasFeature(ctx, "cal_com") || hasFeature(ctx, "acuity") || hasFeature(ctx, "other_booking")) {
    credSteps.push({ step_number: credNum++, step_key: "booking_key", title: "Booking platform credentials saved", description: "Collect booking credentials.", guidance: "Save API key or embed code to vault.", is_required: true });
  }
  if (hasFeature(ctx, "hubspot") || hasFeature(ctx, "pipedrive")) {
    credSteps.push({ step_number: credNum++, step_key: "crm_key", title: "CRM API key saved", description: "Collect CRM credentials.", guidance: "Save API key and pipeline/workspace ID to vault.", is_required: true });
  }
  if (hasFeature(ctx, "live_chat") || hasFeature(ctx, "ai_chatbot")) {
    credSteps.push({ step_number: credNum++, step_key: "chat_key", title: "Chat platform credentials saved", description: "Collect chat credentials.", guidance: "Save workspace ID or script key to vault.", is_required: true });
  }
  if (hasFeature(ctx, "google_maps")) {
    credSteps.push({ step_number: credNum++, step_key: "maps_key", title: "Google Maps API key saved", description: "Collect Maps credentials.", guidance: "Save API key and confirm billing is active.", is_required: true });
  }
  if (hasFeature(ctx, "social_feed")) {
    credSteps.push({ step_number: credNum++, step_key: "social_key", title: "Social feed access token saved", description: "Collect social credentials.", guidance: "Save access token or embed ID to vault.", is_required: true });
  }
  if (hasFeature(ctx, "stripe_subscriptions")) {
    credSteps.push({ step_number: credNum++, step_key: "stripe_product_ids", title: "Stripe product/price IDs confirmed", description: "Confirm Stripe products.", guidance: "Save product IDs and price IDs to vault.", is_required: true });
  }
  if (hasFeature(ctx, "custom_api")) {
    credSteps.push({ step_number: credNum++, step_key: "custom_api_key", title: "Custom API credentials saved", description: "Collect custom API credentials.", guidance: "Save credentials and description to vault.", is_required: true });
  }

  phases.push({
    phase_number: 5, phase_key: "credentials",
    title: "Client Access & Credentials",
    description: "Collect all third-party credentials and save to the vault.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "approval_frontend",
    steps: credSteps,
  });

  // PHASE 6 — Back End Build (conditional)
  if (hasBackend(ctx)) {
    const beSteps: StepConfig[] = [
      { step_number: 1, step_key: "supabase_created", title: "Supabase project created and connected", description: "Create Supabase project.", guidance: "Create a new Supabase project and connect it to Lovable.", is_required: true },
    ];
    let beNum = 2;
    if (hasFeature(ctx, "user_signup_login")) {
      beSteps.push({ step_number: beNum++, step_key: "auth_flows", title: "Authentication flows built", description: "Build auth flows.", guidance: "Sign up, login, forgot password, and email verification.", is_required: true });
      beSteps.push({ step_number: beNum++, step_key: "user_profile", title: "User profile page built", description: "Build user profile.", guidance: "Create user profile page with editable fields.", is_required: true });
    }
    beSteps.push({ step_number: beNum++, step_key: "db_schema", title: "Database schema and tables created", description: "Create schema.", guidance: "Design and create all required tables in Supabase.", is_required: true });
    beSteps.push({ step_number: beNum++, step_key: "rls_policies", title: "RLS policies enabled on all tables", description: "Set up RLS.", guidance: "Enable Row Level Security on every table.", is_required: true });
    beSteps.push({ step_number: beNum++, step_key: "forms_wired", title: "Form submissions wired to database", description: "Wire forms.", guidance: "Connect all forms to save data to the database.", is_required: true });
    if (ctx.selected_pages.includes("Admin Panel")) {
      beSteps.push({ step_number: beNum++, step_key: "admin_panel", title: "Admin panel built", description: "Build admin panel.", guidance: "Create the admin panel with all required features.", is_required: true });
    }
    if (ctx.selected_pages.includes("User Dashboard")) {
      beSteps.push({ step_number: beNum++, step_key: "user_dashboard", title: "User dashboard built", description: "Build dashboard.", guidance: "Create user dashboard with key metrics and data.", is_required: true });
    }
    if (ctx.selected_pages.includes("Client Portal")) {
      beSteps.push({ step_number: beNum++, step_key: "client_portal", title: "Client portal built", description: "Build client portal.", guidance: "Create the client-facing portal.", is_required: true });
    }
    beSteps.push({ step_number: beNum++, step_key: "be_qc", title: "Internal back-end quality check", description: "Run QC.", guidance: "Test all flows, auth, and data operations.", is_required: true });

    phases.push({
      phase_number: 6, phase_key: "backend",
      title: "Back End Build",
      description: "Database, authentication, and server-side functionality.",
      is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "approval_frontend",
      steps: beSteps,
    });

    // PHASE 7 — Client Approval: Functionality
    phases.push({
      phase_number: 7, phase_key: "approval_backend",
      title: "Client Approval: Functionality",
      description: "Demonstrate all functional flows and get written sign-off.",
      is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "backend",
      steps: [
        { step_number: 1, step_key: "loom_functional", title: "Loom walkthrough of all functional flows", description: "Record functionality walkthrough.", guidance: "Demonstrate every functional flow in a Loom video.", is_required: true },
        { step_number: 2, step_key: "auth_confirmed", title: "All auth flows demonstrated and confirmed", description: "Confirm auth.", guidance: "Show sign up, login, password reset working.", is_required: true },
        { step_number: 3, step_key: "data_confirmed", title: "All data flows demonstrated and confirmed", description: "Confirm data.", guidance: "Show form submissions, data storage, and retrieval.", is_required: true },
        { step_number: 4, step_key: "func_signoff", title: "Written sign-off received — attach proof", description: "Get sign-off.", guidance: "Upload screenshot of written approval.", is_required: true },
      ],
    });
  }

  // PHASE 8 — Integrations
  const intSteps: StepConfig[] = [];
  let intNum = 1;

  if (hasFeature(ctx, "stripe_one_time")) {
    intSteps.push(
      { step_number: intNum++, step_key: "stripe_test_added", title: "Stripe test keys added to Lovable", description: "Add test keys.", guidance: "Add via secure form in Lovable.", is_required: true },
      { step_number: intNum++, step_key: "checkout_built", title: "Checkout flow built", description: "Build checkout.", guidance: "Complete the checkout page and payment flow.", is_required: true },
      { step_number: intNum++, step_key: "payment_success", title: "Payment success redirect built", description: "Build success page.", guidance: "Create the payment confirmation page.", is_required: true },
      { step_number: intNum++, step_key: "payment_failure", title: "Payment failure redirect built", description: "Build failure page.", guidance: "Create the payment error/retry page.", is_required: true },
      { step_number: intNum++, step_key: "test_payment", title: "Test payment processed (4242 4242 4242 4242)", description: "Test payment.", guidance: "Process a test payment with card 4242 4242 4242 4242.", is_required: true },
    );
  }
  if (hasFeature(ctx, "stripe_subscriptions")) {
    intSteps.push(
      { step_number: intNum++, step_key: "sub_plans", title: "Subscription plans created in Stripe", description: "Create plans.", guidance: "Set up subscription products and prices in Stripe dashboard.", is_required: true },
      { step_number: intNum++, step_key: "sub_checkout", title: "Subscription checkout flow built", description: "Build sub checkout.", guidance: "Complete the subscription checkout flow.", is_required: true },
      { step_number: intNum++, step_key: "billing_portal", title: "Billing portal built", description: "Build billing portal.", guidance: "Upgrade, cancel, and manage subscription.", is_required: true },
      { step_number: intNum++, step_key: "content_gating", title: "Content gating based on subscription", description: "Build content gating.", guidance: "Restrict content based on active subscription.", is_required: true },
      { step_number: intNum++, step_key: "test_subscription", title: "Test subscription flow end-to-end", description: "Test subscription.", guidance: "Complete a full subscription test cycle.", is_required: true },
    );
  }
  if (hasFeature(ctx, "calendly") || hasFeature(ctx, "cal_com") || hasFeature(ctx, "acuity") || hasFeature(ctx, "other_booking")) {
    intSteps.push(
      { step_number: intNum++, step_key: "booking_confirmed", title: "Booking platform confirmed active", description: "Verify booking.", guidance: "Confirm the booking platform account is active.", is_required: true },
      { step_number: intNum++, step_key: "booking_embedded", title: "Booking widget embedded", description: "Embed widget.", guidance: "Embed the booking widget on the correct pages.", is_required: true },
      { step_number: intNum++, step_key: "booking_email", title: "Booking confirmation email confirmed", description: "Test email.", guidance: "Confirm booking confirmation emails are sending.", is_required: true },
    );
  }
  if (hasFeature(ctx, "email_marketing")) {
    intSteps.push(
      { step_number: intNum++, step_key: "newsletter_connected", title: "Newsletter form connected", description: "Connect newsletter.", guidance: "Wire the newsletter form to the email platform.", is_required: true },
      { step_number: intNum++, step_key: "newsletter_tested", title: "Test subscription confirmed", description: "Test newsletter.", guidance: "Submit a test subscription and verify in the platform.", is_required: true },
    );
  }
  if (hasFeature(ctx, "transactional_email")) {
    intSteps.push(
      { step_number: intNum++, step_key: "contact_email", title: "Contact form confirmation email sends", description: "Test contact form email.", guidance: "Submit the contact form and verify the confirmation email.", is_required: true },
    );
  }
  if (hasFeature(ctx, "ga4") || hasFeature(ctx, "plausible")) {
    intSteps.push(
      { step_number: intNum++, step_key: "analytics_added", title: "Analytics tracking script added", description: "Add tracking.", guidance: "Add the GA4 or Plausible tracking script.", is_required: true },
      { step_number: intNum++, step_key: "analytics_verified", title: "Tracking verified in real-time view", description: "Verify tracking.", guidance: "Check the analytics real-time view to confirm tracking.", is_required: true },
    );
  }
  if (hasFeature(ctx, "live_chat") || hasFeature(ctx, "ai_chatbot")) {
    intSteps.push(
      { step_number: intNum++, step_key: "chat_added", title: "Chat widget added to site", description: "Add chat.", guidance: "Add the chat widget script to the site.", is_required: true },
    );
  }
  if (hasFeature(ctx, "google_maps")) {
    intSteps.push(
      { step_number: intNum++, step_key: "maps_embedded", title: "Google Maps embedded on contact page", description: "Embed map.", guidance: "Add the Google Maps embed with the correct API key.", is_required: true },
    );
  }
  if (hasFeature(ctx, "social_feed")) {
    intSteps.push(
      { step_number: intNum++, step_key: "social_embedded", title: "Social feed embedded and confirmed", description: "Embed social feed.", guidance: "Add the social feed embed and confirm it loads on mobile.", is_required: true },
    );
  }

  if (intSteps.length > 0) {
    const unlockAfter = hasBackend(ctx) ? "approval_backend" : "approval_frontend";
    phases.push({
      phase_number: 8, phase_key: "integrations",
      title: "Integrations",
      description: "Connect all third-party integrations and test.",
      is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: unlockAfter,
      steps: intSteps,
    });
  }

  // PHASE 9 — QA & Testing
  const qaUnlock = intSteps.length > 0 ? "integrations" : (hasBackend(ctx) ? "approval_backend" : "approval_frontend");
  phases.push({
    phase_number: 9, phase_key: "qa",
    title: "QA & Testing",
    description: "Comprehensive cross-browser, cross-device, and functional testing.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: qaUnlock,
    steps: [
      { step_number: 1, step_key: "mobile_test", title: "Mobile (iPhone + Android) — all pages tested", description: "Test mobile.", guidance: "Test on real devices or emulators.", is_required: true },
      { step_number: 2, step_key: "tablet_test", title: "Tablet view — all pages tested", description: "Test tablet.", guidance: "Test on iPad/tablet viewport.", is_required: true },
      { step_number: 3, step_key: "desktop_test", title: "Desktop 1280px — all pages tested", description: "Test desktop.", guidance: "Test at 1280px viewport width.", is_required: true },
      { step_number: 4, step_key: "large_screen_test", title: "Large screen 1920px — all pages tested", description: "Test large screen.", guidance: "Test at 1920px viewport width.", is_required: true },
      { step_number: 5, step_key: "chrome_test", title: "Chrome — full site tested", description: "Test Chrome.", guidance: "Complete site test in Chrome.", is_required: true },
      { step_number: 6, step_key: "safari_test", title: "Safari — full site tested", description: "Test Safari.", guidance: "Critical for iOS users.", is_required: true },
      { step_number: 7, step_key: "firefox_test", title: "Firefox — full site tested", description: "Test Firefox.", guidance: "Complete site test in Firefox.", is_required: true },
      { step_number: 8, step_key: "forms_test", title: "All forms submit and send confirmation", description: "Test forms.", guidance: "Submit every form and verify confirmation.", is_required: true },
      { step_number: 9, step_key: "ctas_test", title: "All CTAs and links work correctly", description: "Test links.", guidance: "Click every CTA and internal link.", is_required: true },
      { step_number: 10, step_key: "pagespeed", title: "PageSpeed score 80+ confirmed", description: "Check PageSpeed.", guidance: "Run Google PageSpeed Insights.", is_required: true },
      { step_number: 11, step_key: "alt_text", title: "All images have alt text", description: "Check alt text.", guidance: "Verify every image has descriptive alt text.", is_required: true },
      { step_number: 12, step_key: "meta_tags", title: "Page titles and meta descriptions set", description: "Check meta.", guidance: "Verify SEO meta on all pages.", is_required: true },
      { step_number: 13, step_key: "og_tags", title: "Open Graph / social share tags confirmed", description: "Check OG.", guidance: "Test social sharing preview.", is_required: true },
      { step_number: 14, step_key: "favicon_check", title: "Favicon displaying correctly", description: "Check favicon.", guidance: "Verify favicon in browser tab.", is_required: true },
      { step_number: 15, step_key: "no_placeholder", title: "Zero placeholder text remaining", description: "Check placeholders.", guidance: "Search entire site for placeholder content.", is_required: true },
      { step_number: 16, step_key: "spelling_check", title: "Spelling and grammar check completed", description: "Check spelling.", guidance: "Review all text for errors.", is_required: true },
      { step_number: 17, step_key: "legal_content", title: "Privacy policy and terms contain real content", description: "Check legal.", guidance: "Verify legal pages have actual content.", is_required: true },
      { step_number: 18, step_key: "no_exposed_keys", title: "No API keys visible in dev tools", description: "Check security.", guidance: "Inspect browser dev tools for exposed keys.", is_required: true },
      { step_number: 19, step_key: "rls_confirmed", title: "Supabase RLS policies confirmed active", description: "Check RLS.", guidance: "Verify RLS is enabled on all tables.", is_required: true },
    ],
  });

  // PHASE 10 — Final Approval & Payment
  phases.push({
    phase_number: 10, phase_key: "approval_final",
    title: "Final Approval & Payment",
    description: "Final walkthrough, scope verification, and payment collection.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "qa",
    steps: [
      { step_number: 1, step_key: "final_loom", title: "Full Loom walkthrough recorded and sent", description: "Record final walkthrough.", guidance: "Walk through the entire completed site.", is_required: true },
      { step_number: 2, step_key: "scope_check", title: "Every feature checked against scope", description: "Verify scope.", guidance: "Compare delivered features against the signed scope.", is_required: true },
      { step_number: 3, step_key: "final_payment", title: "Final 50% payment received — confirm amount", description: "Collect final payment.", guidance: "Confirm amount and date of final payment.", is_required: true },
      { step_number: 4, step_key: "cr_notice", title: "Client informed: future changes are billable CRs", description: "Inform client.", guidance: "Ensure client understands change request billing.", is_required: true },
      { step_number: 5, step_key: "final_signoff", title: "Written final sign-off received — attach proof", description: "Get final sign-off.", guidance: "Upload screenshot of written final approval.", is_required: true },
      { step_number: 6, step_key: "payment_confirmed", title: "Payment received before export confirmed", description: "Confirm payment.", guidance: "Note that payment has been confirmed before export.", is_required: true },
    ],
  });

  // PHASE 11 — Export & Go Live (STRICTLY LINEAR)
  phases.push({
    phase_number: 11, phase_key: "export",
    title: "Export & Go Live",
    description: "Export from Lovable, deploy to Vercel, connect domain, and go live.",
    is_locked: true, is_strictly_linear: true, unlocks_after_phase_key: "approval_final",
    steps: [
      { step_number: 1, step_key: "final_save", title: "Final Lovable Save", description: "Make final edits in Lovable.", guidance: "Confirm everything matches the client's signed-off version exactly. Do not proceed until the site is exactly as approved.", is_required: true },
      { step_number: 2, step_key: "github_open", title: "Open GitHub Integration in Lovable", description: "Open GitHub integration.", guidance: "In the Lovable editor, click the GitHub icon in the top-right corner. Sign in and authorise if needed.", is_required: true },
      { step_number: 3, step_key: "github_create_repo", title: "Create GitHub Repository", description: "Create the repo.", guidance: "Click 'Create Repository'. Name it [clientname]-website. Set to Private. Let Lovable create it.", is_required: true },
      { step_number: 4, step_key: "github_push_confirm", title: "Confirm GitHub Push Successful", description: "Verify the push.", guidance: "Wait for green success. Open GitHub and verify all files are present.", is_required: true },
      { step_number: 5, step_key: "vercel_create", title: "Create New Vercel Project", description: "Create Vercel project.", guidance: "Go to vercel.com → Add New Project → Import the GitHub repo.", is_required: true },
      { step_number: 6, step_key: "vercel_framework", title: "Confirm Framework Settings", description: "Confirm Vite detected.", guidance: "Verify framework preset shows 'Vite' before proceeding.", is_required: true },
      { step_number: 7, step_key: "vercel_env_vars", title: "Add Environment Variables in Vercel", description: "Add env vars.", guidance: "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the vault.", is_required: true },
      { step_number: 8, step_key: "vercel_deploy", title: "Deploy on Vercel", description: "Deploy the project.", guidance: "Click Deploy. Watch the build log. Wait for success.", is_required: true },
      { step_number: 9, step_key: "vercel_preview", title: "Confirm Vercel Preview URL", description: "Test preview URL.", guidance: "Click the preview URL and test every page.", is_required: true },
      { step_number: 10, step_key: "vercel_domain", title: "Add Domain in Vercel", description: "Add custom domain.", guidance: "Settings → Domains → Add Domain. Note the DNS records.", is_required: true },
      { step_number: 11, step_key: "domain_login", title: "Log Into Client Domain Registrar", description: "Access DNS settings.", guidance: "Use credentials from the vault (Step 5.1).", is_required: true },
      { step_number: 12, step_key: "dns_records", title: "Add DNS Records", description: "Add DNS records.", guidance: "A Record: 76.76.21.21 for root. CNAME: cname.vercel-dns.com for www.", is_required: true },
      { step_number: 13, step_key: "domain_verified", title: "Confirm Domain Verified in Vercel", description: "Wait for verification.", guidance: "Wait for green 'Valid Configuration' in Vercel Domains panel.", is_required: true },
      { step_number: 14, step_key: "https_active", title: "Confirm HTTPS Active", description: "Check SSL.", guidance: "Open the custom domain and verify the HTTPS padlock.", is_required: true },
      { step_number: 15, step_key: "live_keys", title: "Switch to Live API Keys", description: "Update to production keys.", guidance: "In Vercel env vars, switch to live Stripe keys and other production values.", is_required: true },
      { step_number: 16, step_key: "redeploy", title: "Redeploy After Key Update", description: "Redeploy.", guidance: "Trigger a fresh deployment in Vercel after updating env vars.", is_required: true },
      { step_number: 17, step_key: "smoke_test", title: "Full Production Smoke Test", description: "Test everything live.", guidance: "Test every page, form, payment flow, auth, and integration on the live domain.", is_required: true },
      { step_number: 18, step_key: "handover_loom", title: "Record Client Handover Loom", description: "Record handover.", guidance: "Walk the client through: leads, analytics, orders, admin panel, and support contact.", is_required: true },
      { step_number: 19, step_key: "vault_final", title: "Save All Credentials to Vault", description: "Finalize vault.", guidance: "Confirm every credential is saved: domain, Vercel, Stripe, all integrations.", is_required: true },
      { step_number: 20, step_key: "mark_live", title: "Mark Project Live in Sited", description: "Go live.", guidance: "Set build_flow to is_live: true. Notify the client their site is live.", is_required: true },
    ],
  });

  // PHASE 12 — Maintenance
  phases.push({
    phase_number: 12, phase_key: "maintenance",
    title: "Maintenance",
    description: "Ongoing monthly maintenance tasks.",
    is_locked: true, is_strictly_linear: false, unlocks_after_phase_key: "export",
    steps: [
      { step_number: 1, step_key: "uptime_check", title: "Site uptime confirmed", description: "Check uptime.", guidance: "Verify uptime via UptimeRobot or equivalent.", is_required: true },
      { step_number: 2, step_key: "pagespeed_monthly", title: "PageSpeed score checked and recorded", description: "Monthly PageSpeed.", guidance: "Run PageSpeed and record the score.", is_required: true },
      { step_number: 3, step_key: "vercel_health", title: "Vercel — no errors in last 30 days", description: "Check Vercel.", guidance: "Review deployment logs for errors.", is_required: true },
      { step_number: 4, step_key: "forms_monthly", title: "All forms confirmed submitting", description: "Monthly form test.", guidance: "Submit each form and verify.", is_required: true },
      { step_number: 5, step_key: "analytics_report", title: "Analytics report reviewed and sent", description: "Send analytics.", guidance: "Review and send the monthly analytics report.", is_required: true },
      { step_number: 6, step_key: "top_pages", title: "Top pages and exit pages reviewed", description: "Review pages.", guidance: "Identify top and exit pages for insights.", is_required: true },
      { step_number: 7, step_key: "improvement", title: "One data-led improvement suggested", description: "Suggest improvement.", guidance: "Based on analytics, suggest one actionable improvement.", is_required: true },
      { step_number: 8, step_key: "content_updates", title: "Content updates made (if on retainer)", description: "Make updates.", guidance: "Apply any content changes requested.", is_required: false },
      { step_number: 9, step_key: "retainer_invoiced", title: "Retainer tier confirmed and invoiced", description: "Invoice retainer.", guidance: "Confirm retainer tier is active and invoice sent.", is_required: true },
      { step_number: 10, step_key: "cr_logged", title: "Change requests logged and quoted", description: "Log CRs.", guidance: "Record any new change requests and provide quotes.", is_required: true },
    ],
  });

  // Renumber phases sequentially
  let phaseIdx = 1;
  for (const p of phases) {
    p.phase_number = phaseIdx;
    p.order_index = phaseIdx - 1;
    phaseIdx++;
  }

  return phases;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, project_type, selected_features = [], selected_pages = [], selected_integrations = [], business_name = "", discovery_data = null, user_id = null } = await req.json();

    if (!lead_id || !project_type) {
      throw new Error("lead_id and project_type are required");
    }

    const stagingUrl = business_name
      ? `${business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.sited.co`
      : null;

    // Create build_flow
    const { data: flow, error: flowErr } = await supabase
      .from("build_flows")
      .insert({
        lead_id,
        project_type,
        status: "active",
        staging_url: stagingUrl,
      })
      .select()
      .single();

    if (flowErr) throw flowErr;

    const ctx: BuildContext = { project_type, selected_features, selected_pages, selected_integrations };
    const phases = generatePhases(ctx);

    // Save discovery answers if provided
    if (discovery_data && typeof discovery_data === "object") {
      const answerRows = Object.entries(discovery_data).map(([key, value]) => ({
        build_flow_id: flow.id,
        question_key: key,
        answer_value: typeof value === "string" ? value : JSON.stringify(value),
      }));
      if (answerRows.length > 0) {
        await supabase.from("discovery_answers").insert(answerRows);
      }
    }

    // Insert phases
    let discoveryStepId: string | null = null;
    let discoveryPhaseId: string | null = null;
    for (const phase of phases) {
      const { data: phaseRow, error: phaseErr } = await supabase
        .from("build_phases")
        .insert({
          build_flow_id: flow.id,
          phase_number: phase.phase_number,
          phase_key: phase.phase_key,
          title: phase.title,
          description: phase.description,
          is_locked: phase.is_locked,
          is_strictly_linear: phase.is_strictly_linear,
          unlocks_after_phase_key: phase.unlocks_after_phase_key,
          order_index: phase.phase_number - 1,
        })
        .select()
        .single();

      if (phaseErr) throw phaseErr;

      // Insert steps
      const stepRows = phase.steps.map((s) => ({
        phase_id: phaseRow.id,
        step_number: s.step_number,
        step_key: s.step_key,
        title: s.title,
        description: s.description,
        guidance: s.guidance,
        is_required: s.is_required,
        is_locked: phase.is_strictly_linear && s.step_number > 1,
        order_index: s.step_number - 1,
      }));

      const { data: insertedSteps, error: stepsErr } = await supabase
        .from("build_steps")
        .insert(stepRows)
        .select();

      if (stepsErr) throw stepsErr;

      // Auto-complete Phase 1, Step 1 (discovery_call) since the discovery form was just submitted
      if (phase.phase_key === "onboarding" && discovery_data && user_id) {
        const discoveryStep = (insertedSteps || []).find((s: any) => s.step_key === "discovery_call");
        if (discoveryStep) {
          discoveryStepId = discoveryStep.id;
          discoveryPhaseId = phaseRow.id;
          // Mark step as completed
          await supabase.from("build_steps").update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            completed_by: user_id,
          }).eq("id", discoveryStep.id);

          // Create step completion record
          await supabase.from("step_completions").insert({
            step_id: discoveryStep.id,
            build_flow_id: flow.id,
            completed_by: user_id,
            description: "Discovery form completed during project creation. Click to view answers.",
          });
        }
      }
    }

    // Create client_assets record
    await supabase.from("client_assets").insert({
      lead_id,
      build_flow_id: flow.id,
    });

    return new Response(JSON.stringify({ build_flow_id: flow.id, phases_created: phases.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
