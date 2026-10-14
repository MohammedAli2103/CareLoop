// Supabase Edge Function: Admin Email OTP Generator & Verifier
// Deno TypeScript environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Calculate SHA-256 hex string in Web Crypto API
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase server credentials in Edge Function environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { action, userId, email, otpCode } = await req.json();

    // --------------------------------------------------------------------------
    // ACTION: REQUEST OTP
    // --------------------------------------------------------------------------
    if (action === "request_otp") {
      if (!userId || !email) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: userId and email." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify that the user has admin role in profiles
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from("profiles")
        .select("role, status, full_name")
        .eq("id", userId)
        .single();

      if (profileErr || !profile || profile.role !== "admin" || profile.status !== "active") {
        return new Response(
          JSON.stringify({ error: "Unauthorized: User is not an active system administrator." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate 6-digit cryptographic OTP
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const codeNumber = 100000 + (array[0] % 900000);
      const generatedOtp = codeNumber.toString();

      // Generate random salt
      const saltBuffer = new Uint8Array(16);
      crypto.getRandomValues(saltBuffer);
      const salt = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, "0")).join("");

      // Hash (salt + otp)
      const otpHash = await sha256(salt + generatedOtp);

      // Invalidate existing unused OTPs for this user
      await supabaseAdmin
        .from("admin_otps")
        .update({ used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("used_at", null);

      // Expires in 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store hashed OTP in database
      const { error: insertErr } = await supabaseAdmin
        .from("admin_otps")
        .insert({
          user_id: userId,
          email,
          otp_hash: otpHash,
          salt,
          attempts_count: 0,
          max_attempts: 5,
          expires_at: expiresAt,
        });

      if (insertErr) {
        console.error("Failed to store OTP:", insertErr);
        return new Response(
          JSON.stringify({ error: "Internal server error generating verification code." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Dispatch Email via Provider (e.g., Resend, Sendgrid, or SMTP)
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      let emailSent = false;

      if (resendApiKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "CareLoop Security <security@careloop.health>",
              to: [email],
              subject: "CareLoop Admin Verification Code",
              html: `
                <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
                  <h2 style="color: #0284c7;">CareLoop Administrator Security</h2>
                  <p>Your one-time sign in verification code is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px; background: #f0f9ff; border-radius: 8px; text-align: center; color: #0369a1; margin: 16px 0;">
                    ${generatedOtp}
                  </div>
                  <p>This code expires in 10 minutes. Do not share this code with anyone.</p>
                </div>
              `,
            }),
          });
          emailSent = emailRes.ok;
        } catch (e) {
          console.error("Resend API error:", e);
        }
      }

      // Log audit event for OTP request
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: userId,
        actor_role: "admin",
        action: "ADMIN_OTP_REQUESTED",
        target_id: userId,
        target_type: "admin_auth",
        details: { email, emailProviderConfigured: !!resendApiKey, sent: emailSent },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: emailSent
            ? "Verification code has been sent to your email."
            : "OTP generated. (Notice: External email provider not yet connected in Edge Function environment).",
          providerConfigured: !!resendApiKey,
          // In development or until SMTP is configured, provide indication
          expiresInMinutes: 10,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY OTP
    // --------------------------------------------------------------------------
    if (action === "verify_otp") {
      if (!userId || !otpCode) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: userId and otpCode." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delegate to secure database RPC or verify in Edge Function
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc("verify_admin_otp", {
        p_user_id: userId,
        p_otp_code: otpCode.trim(),
      });

      if (rpcErr) {
        console.error("RPC Error:", rpcErr);
        return new Response(
          JSON.stringify({ error: rpcErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!rpcResult.success) {
        return new Response(
          JSON.stringify({ error: rpcResult.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Administrator verified successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
