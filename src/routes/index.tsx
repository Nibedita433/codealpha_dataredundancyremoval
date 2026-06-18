import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, ShieldCheck, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Redundancy Removal System" },
      { name: "description", content: "Submit data and prevent duplicate records automatically." },
      { property: "og:title", content: "Data Redundancy Removal System" },
      { property: "og:description", content: "Submit data and prevent duplicate records automatically." },
    ],
  }),
  component: Index,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(255),
});

function Index() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { name: string; email: string }) => {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
      // Pre-check duplicate
      const { data: existing, error: selErr } = await supabase
        .from("records")
        .select("id")
        .eq("email", parsed.data.email)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) {
        const err = new Error("Duplicate record found");
        (err as any).code = "DUPLICATE";
        throw err;
      }
      const { error } = await supabase.from("records").insert(parsed.data);
      if (error) {
        if (error.code === "23505") {
          const e = new Error("Duplicate record found");
          (e as any).code = "DUPLICATE";
          throw e;
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Record saved successfully");
      setName("");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["records"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster position="top-right" richColors />
      <Nav />
      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground mb-4">
            <ShieldCheck className="h-3.5 w-3.5" /> Duplicate-safe submissions
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Data Redundancy Removal
          </h1>
          <p className="mt-3 text-muted-foreground">
            Submit a record. We'll keep it only if the email is unique.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ name, email });
          }}
          className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              maxLength={255}
              required
            />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Submitting..." : "Submit record"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <LayoutDashboard className="h-4 w-4" /> View dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

function Nav() {
  return (
    <header className="border-b bg-card/60 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Database className="h-5 w-5 text-primary" />
          DRRS
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60"
          >
            Submit
          </Link>
          <Link
            to="/dashboard"
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
