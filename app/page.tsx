export default function Page() {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            SolveOnyx Sandbox
          </h1>
          <span className="text-sm text-muted-foreground">
            UI + Supabase Testing Environment
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Intro */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome</h2>
          <p className="text-muted-foreground">
            This sandbox is used to design, test, and validate UI components and
            data interactions before integrating into the main SolveOnyx CPQ
            platform.
          </p>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <a
            href="/sandbox/simple-list"
            className="rounded-xl border bg-white p-6 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg mb-2">Simple List</h3>
            <p className="text-sm text-muted-foreground">
              Test editable list behavior, ordering, and CRUD interactions.
            </p>
          </a>

          {/* Card 2 */}
          <a
            href="/sandbox/configurables"
            className="rounded-xl border bg-white p-6 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg mb-2">Configurables</h3>
            <p className="text-sm text-muted-foreground">
              Experiment with configuration UI and option handling.
            </p>
          </a>

          {/* Card 3 */}
          <a
            href="/sandbox/forms"
            className="rounded-xl border bg-white p-6 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg mb-2">Forms</h3>
            <p className="text-sm text-muted-foreground">
              Build and test input layouts, validation, and UX patterns.
            </p>
          </a>
        </div>

        {/* Footer note */}
        <div className="pt-6 border-t text-sm text-muted-foreground">
          Use this environment to iterate quickly without impacting the main
          application.
        </div>
      </div>
    </div>
  );
}