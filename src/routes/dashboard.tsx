import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { Database, LayoutDashboard, Plus } from "lucide-react";
import { listRecords } from "@/lib/records.functions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const recordsQuery = queryOptions({
  queryKey: ["records"],
  queryFn: () => listRecords(),
});

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Data Redundancy Removal System" },
      { name: "description", content: "Browse all stored unique records." },
      { property: "og:title", content: "Dashboard — DRRS" },
      { property: "og:description", content: "Browse all stored unique records." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(recordsQuery),
  component: DashboardPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-10 text-center">
      <p className="text-destructive mb-4">Failed to load records: {error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  ),
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-10 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground mb-3">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All records</h1>
            <p className="text-muted-foreground mt-1">Live view of every unique submission.</p>
          </div>
          <Link to="/">
            <Button>
              <Plus className="h-4 w-4 mr-1" /> New record
            </Button>
          </Link>
        </div>
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          <RecordsTable />
        </Suspense>
      </main>
    </div>
  );
}

function RecordsTable() {
  const { data } = useSuspenseQuery(recordsQuery);
  const { records, total, unique } = data;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Total records" value={total} />
        <StatCard label="Unique emails" value={unique} />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                  No records yet. Submit your first one.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.emailMasked}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
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
