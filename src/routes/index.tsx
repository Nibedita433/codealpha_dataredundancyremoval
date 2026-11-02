import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createRecord, listRecords } from "@/lib/records.functions";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Search,
  PlusCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"submit" | "database">("submit");
  const queryClient = useQueryClient();
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
      toast.success("Record saved successfully", {
        description: "Zero redundancy verified. Added to database.",
        action: {
          label: "View DB",
          onClick: () => setActiveTab("database"),
        },
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["records"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 text-foreground">
      <Toaster position="top-right" richColors />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="mx-auto max-w-5xl px-4 pt-10 pb-20">
        {activeTab === "submit" ? (
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground mb-4">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Duplicate-safe submissions
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Data Redundancy Removal
              </h1>
              <p className="mt-2 text-muted-foreground">
                Submit a record. Duplicate emails are automatically blocked from entering the database.
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ada Lovelace" maxLength={100} {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="e.g. ada@example.com"
                          maxLength={255}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                  {mutation.isPending ? "Validating & Submitting..." : "Submit Record"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("database")}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                <Database className="h-4 w-4" /> Check stored database records
              </button>
            </div>
          </div>
        ) : (
          <DatabaseView onNewRecord={() => setActiveTab("submit")} />
        )}
      </main>
    </div>
  );
}

function DatabaseView({ onNewRecord }: { onNewRecord: () => void }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["records"],
    queryFn: () => listRecords(),
  });

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const unique = data?.unique ?? 0;

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) => r.name.toLowerCase().includes(q) || r.emailMasked.toLowerCase().includes(q),
    );
  }, [records, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground mb-2">
            <Database className="h-3.5 w-3.5 text-primary" /> PostgreSQL Database
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Database Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live view of unique records stored with zero redundancy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={onNewRecord} className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            New Submission
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Unique Entries
          </div>
          <div className="text-3xl font-bold mt-2">{total}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> All duplicate attempts filtered
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Redundancy Rate
          </div>
          <div className="text-3xl font-bold mt-2">0%</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-primary" /> Guaranteed by database unique constraints
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Loading database records...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium mb-3">
            Failed to load records: {(error as Error)?.message || "Unknown error"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Masked Email</TableHead>
                <TableHead className="hidden sm:table-cell">Timestamp</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    {search ? "No matching records found." : "No records in the database yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {r.emailMasked}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="gap-1 font-normal text-xs">
                        <CheckCircle2 className="h-3 w-3 text-green-500" /> Unique
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Nav({
  activeTab,
  setActiveTab,
}: {
  activeTab: "submit" | "database";
  setActiveTab: (tab: "submit" | "database") => void;
}) {
  return (
    <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab("submit")}
          className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Database className="h-5 w-5 text-primary" />
          DRRS
        </button>
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("submit")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer",
              activeTab === "submit"
                ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("database")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer",
              activeTab === "database"
                ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
          >
            <Database className="h-4 w-4" />
            Database
          </button>
        </nav>
      </div>
    </header>
  );
}
