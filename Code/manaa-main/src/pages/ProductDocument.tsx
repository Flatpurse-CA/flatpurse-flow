import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, FileText, Printer } from "lucide-react";
import { Link } from "react-router-dom";

function useMarkdownContent() {
  const [raw, setRaw] = useState("");
  useEffect(() => {
    fetch("/manaa-product-document.md")
      .then((r) => r.text())
      .then(setRaw)
      .catch(() => setRaw("# Error loading document"));
  }, []);
  return raw;
}

function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/g, "").replace(/```/g, "").trim();
    return '<pre class="bg-secondary rounded-lg p-4 my-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">' + code + "</pre>";
  });

  // Tables
  html = html.replace(/(\n\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/g, (match) => {
    const lines = match.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return match;
    const headers = lines[0].split("|").filter(Boolean).map((h) => h.trim());
    const rows = lines.slice(2).map((line) => line.split("|").filter(Boolean).map((c) => c.trim()));

    let table = '<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse">';
    table += "<thead><tr>";
    headers.forEach((h) => {
      table += '<th class="border border-border px-3 py-2 text-left bg-secondary font-medium text-xs">' + h + "</th>";
    });
    table += "</tr></thead><tbody>";
    rows.forEach((row) => {
      table += "<tr>";
      row.forEach((cell) => {
        table += '<td class="border border-border px-3 py-2 text-xs">' + cell + "</td>";
      });
      table += "</tr>";
    });
    table += "</tbody></table></div>";
    return table;
  });

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold mt-6 mb-2 text-foreground">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-8 mb-3 text-foreground">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-12 mb-4 pb-2 border-b border-border text-foreground">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl sm:text-3xl font-extrabold mt-10 mb-6 text-foreground">$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-sm leading-relaxed text-foreground/80">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-sm leading-relaxed text-foreground/80">$1</li>');

  // Blockquotes
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-primary/30 pl-4 py-1 my-3 text-muted-foreground italic text-sm">$1</blockquote>'
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />');

  // Paragraphs — lines that aren't already HTML tags or empty
  html = html.replace(/^(?!<[a-zA-Z/]|$|\s*$)(.+)$/gm, '<p class="text-sm leading-relaxed mb-3 text-foreground/80">$1</p>');

  return html;
}

export default function ProductDocument() {
  const raw = useMarkdownContent();
  const html = useMemo(() => markdownToHtml(raw), [raw]);

  const handleDownload = () => {
    const blob = new Blob([raw], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Manaa-Product-Document-2026.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!raw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Manaa Product Document</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => window.print()}>
              <Printer className="w-3 h-3" /> Print
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownload}>
              <Download className="w-3 h-3" /> Download
            </Button>
          </div>
        </div>
      </div>

      {/* Document body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
