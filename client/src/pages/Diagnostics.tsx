import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Activity, AlertTriangle, MinusCircle } from "lucide-react";

type DiagnosticStatus = "pass" | "fail" | "skipped";

interface DiagnosticResult {
  id: string;
  name: string;
  category: string;
  status: DiagnosticStatus;
  message: string;
  durationMs: number;
}

interface DiagnosticReport {
  results: DiagnosticResult[];
  summary: { total: number; passed: number; failed: number; skipped: number };
}

export default function Diagnostics() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setRunning(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/diagnostics/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data: DiagnosticReport = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  };

  const categories = report
    ? Array.from(new Set(report.results.map((r) => r.category)))
    : [];

  const allPassed = report && report.summary.failed === 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-7 w-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
        </div>
        <p className="text-gray-600">
          One click verifies every API key and every core function in this app.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          size="lg"
          onClick={runDiagnostics}
          disabled={running}
          className="px-10 py-6 text-lg"
          data-testid="button-run-diagnostics"
        >
          {running ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running all checks…
            </>
          ) : (
            <>
              <Activity className="mr-2 h-5 w-5" />
              Verify Everything
            </>
          )}
        </Button>
      </div>

      {running && (
        <p className="text-center text-sm text-gray-500 mb-6" data-testid="text-running-note">
          Testing live connections to every AI provider and running the analysis
          engine end-to-end. This can take up to a minute.
        </p>
      )}

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-700" data-testid="text-error">{error}</span>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <Card
            className={`mb-6 ${allPassed ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {allPassed ? (
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-7 w-7 text-amber-600" />
                  )}
                  <div>
                    <p className="text-lg font-semibold" data-testid="text-summary">
                      {allPassed
                        ? "All systems operational"
                        : `${report.summary.failed} of ${report.summary.total} checks failed`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.summary.passed} passed · {report.summary.failed} failed
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {report.summary.passed} Passed
                  </Badge>
                  {report.summary.failed > 0 && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                      {report.summary.failed} Failed
                    </Badge>
                  )}
                  {report.summary.skipped > 0 && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                      {report.summary.skipped} Skipped
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {categories.map((category) => (
            <Card key={category} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-700">{category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {report.results
                    .filter((r) => r.category === category)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start justify-between gap-4 py-3"
                        data-testid={`row-check-${r.id}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {r.status === "pass" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          ) : r.status === "skipped" ? (
                            <MinusCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900" data-testid={`text-name-${r.id}`}>
                              {r.name}
                            </p>
                            <p
                              className={`text-sm break-words ${r.status === "fail" ? "text-red-600" : "text-gray-500"}`}
                              data-testid={`text-message-${r.id}`}
                            >
                              {r.message}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                          {(r.durationMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
