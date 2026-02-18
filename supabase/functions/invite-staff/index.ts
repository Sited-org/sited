import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pwd = "";
  for (let i = 0; i < 14; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the caller is an admin with can_manage_users
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: callerError } = await supabase.auth.getUser(token);
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller has can_manage_users permission
    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("can_manage_users")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    if (!callerRole?.can_manage_users) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role, display_name } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["developer", "sales", "admin", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // Check if they already have a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingRole) {
        return new Response(JSON.stringify({ error: "This user already has an account" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update their password
      await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
    } else {
      // Create the auth user with email confirmed
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        console.error("Error creating user:", createError);
        return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
    }

    // Role permission defaults
    const rolePermissions: Record<string, any> = {
      owner: { can_view: true, can_edit_leads: true, can_manage_users: true, can_view_payments: true, can_edit_project: true, can_delete_leads: true, can_charge_cards: true },
      admin: { can_view: true, can_edit_leads: true, can_manage_users: true, can_view_payments: true, can_edit_project: true, can_delete_leads: true, can_charge_cards: true },
      developer: { can_view: true, can_edit_leads: false, can_manage_users: false, can_view_payments: false, can_edit_project: true, can_delete_leads: false, can_charge_cards: false },
      sales: { can_view: true, can_edit_leads: false, can_manage_users: false, can_view_payments: true, can_edit_project: false, can_delete_leads: false, can_charge_cards: true },
      editor: { can_view: true, can_edit_leads: true, can_manage_users: false, can_view_payments: true, can_edit_project: true, can_delete_leads: false, can_charge_cards: false },
      viewer: { can_view: true, can_edit_leads: false, can_manage_users: false, can_view_payments: false, can_edit_project: false, can_delete_leads: false, can_charge_cards: false },
    };

    const perms = rolePermissions[role] || rolePermissions.viewer;

    // Insert user_roles
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
      ...perms,
    });

    if (roleError) {
      console.error("Error inserting role:", roleError);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert admin_profiles
    const name = display_name || email.split("@")[0];
    const { error: profileError } = await supabase.from("admin_profiles").insert({
      user_id: userId,
      display_name: name,
      email: email.toLowerCase().trim(),
    });

    if (profileError) {
      console.error("Error inserting profile:", profileError);
      // Non-fatal, role is already created
    }

    // Determine login URL and role label
    const loginUrl = "https://sited.co/admin/login";
    const roleLabels: Record<string, string> = {
      developer: "Developer",
      sales: "Sales",
      admin: "Admin",
      editor: "Editor",
      viewer: "Viewer",
    };
    const roleLabel = roleLabels[role] || "Staff";
    const dashboardPath = role === "developer" ? "/dev" : "/admin";

    // Try to fetch the email template from the database
    let emailSubject = `You've been invited to Sited as ${roleLabel}`;
    let emailBodyHtml = "";

    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html, is_enabled")
      .eq("template_type", "staff_invitation")
      .maybeSingle();

    if (template?.is_enabled && template.body_html) {
      // Use the database template with variable replacement
      const replaceVars = (str: string) =>
        str
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{email\}\}/g, email)
          .replace(/\{\{role\}\}/g, roleLabel)
          .replace(/\{\{password\}\}/g, tempPassword)
          .replace(/\{\{login_url\}\}/g, loginUrl)
          .replace(/\{\{dashboard_path\}\}/g, dashboardPath);

      emailSubject = replaceVars(template.subject);
      // Wrap template body in the branded email shell
      const bodyContent = replaceVars(template.body_html);
      emailBodyHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a1a1a, #333); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Sited</h1>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">You've been added as <strong style="color: white;">${roleLabel}</strong></p>
            </div>
            <div style="padding: 30px;">${bodyContent}</div>
            <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">If you didn't expect this invitation, please ignore this email.</p>
            </div>
          </div>
        </body></html>`;
    } else {
      // Fallback: hardcoded template
      emailBodyHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #1a1a1a, #333); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Sited</h1>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">You've been added as <strong style="color: white;">${roleLabel}</strong></p>
            </div>
            <div style="padding: 30px;">
              <p style="color: #4b5563; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4b5563; margin: 0 0 20px;">You've been invited to the Sited platform. Use the credentials below to log in, then you'll be asked to verify with a one-time code sent to your email.</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin: 0 0 12px;">Your Login Credentials</p>
                <p style="color: #1e293b; margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                <p style="color: #1e293b; margin: 0 0 8px; font-size: 14px;"><strong>Temporary Password:</strong></p>
                <div style="background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 16px; letter-spacing: 1px; text-align: center;">${tempPassword}</div>
              </div>
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 13px; margin: 0;"><strong>Important:</strong> Please change your password after your first login for security.</p>
              </div>
              <a href="${loginUrl}" style="display: block; background: #1e293b; color: white; text-decoration: none; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">Log In to Dashboard</a>
              <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0; text-align: center;">After logging in, you'll be redirected to <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${dashboardPath}</code></p>
            </div>
            <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">If you didn't expect this invitation, please ignore this email.</p>
            </div>
          </div>
        </body></html>`;
    }

    // Send welcome email with credentials
    const emailResponse = await resend.emails.send({
      from: "Sited <hello@sited.co>",
      to: [email.toLowerCase().trim()],
      subject: emailSubject,
      html: emailBodyHtml,
    });

    console.log("Invite email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in invite-staff:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
