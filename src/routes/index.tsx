import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createRecord } from "@/lib/records.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Database, ShieldCheck } from "lucide-react";

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

type Schema = z.infer<typeof schema>;

function Index() {
  const create = useServerFn(createRecord);
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", email: "" },
  });

  const mutation = useMutation({
    mutationFn: async (input: Schema) => {
      await create({ data: input });
    },
    onSuccess: () => {
      toast.success("Record saved successfully");
      form.reset();
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-5"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ada Lovelace" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ada@example.com" maxLength={255} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Submitting..." : "Submit record"}
            </Button>
          </form>
        </Form>
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
        </nav>
      </div>
    </header>
  );
}
