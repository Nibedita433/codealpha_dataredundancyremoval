import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
});

export const createRecord = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("records")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (selErr) throw new Error("Could not save record");
    if (existing) {
      const e = new Error("Duplicate record found");
      (e as Error & { code?: string }).code = "DUPLICATE";
      throw e;
    }
    const { error } = await supabaseAdmin.from("records").insert(data);
    if (error) {
      if (error.code === "23505") {
        const e = new Error("Duplicate record found");
        (e as Error & { code?: string }).code = "DUPLICATE";
        throw e;
      }
      throw new Error("Could not save record");
    }
    return { ok: true as const };
  });

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

export type PublicRecord = {
  id: string;
  name: string;
  emailMasked: string;
  created_at: string;
};

export const listRecords = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ records: PublicRecord[]; total: number; unique: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("records")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load records");
    const rows = data ?? [];
    const unique = new Set(rows.map((r) => r.email.toLowerCase())).size;
    return {
      records: rows.map((r) => ({
        id: r.id,
        name: r.name,
        emailMasked: maskEmail(r.email),
        created_at: r.created_at,
      })),
      total: rows.length,
      unique,
    };
  },
);