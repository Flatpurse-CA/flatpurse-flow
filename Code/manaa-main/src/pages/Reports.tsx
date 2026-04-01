import { useState, useMemo } from "react";
import {
  useBusinessTransactions,
  useAccounts,
  useBusinesses,
} from "@/hooks/useData";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Printer,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wallet,
  ShieldCheck,
  Activity,
  Target,
  FileCheck,
  AlertTriangle,
  Calculator,
  Download,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { formatNaira } from "@/lib/currency";
import {
  calculateVATLiability,
  getFIRSPeriod,
  isSmallCompany,
  CURRENT_VAT_RATE,
  SMALL_COMPANY_REVENUE_THRESHOLD,
  TAX_REFORM_HIGHLIGHTS,
  VAT_ZERO_RATED_CATEGORIES,
  DEVELOPMENT_LEVY_RATE,
  calculateDevelopmentLevy,
} from "@/lib/tax";
import { printNRSReport } from "@/lib/print";
import PageHeader from "@/components/PageHeader";

const COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(217, 91%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(190, 70%, 50%)",
];

interface ReportsPageProps {
  selectedBusinessId?: string | null;
}

// ─── Health Grade Logic ───
function computeHealthGrade(
  cashIn: number,
  cashOut: number,
  totalBalance: number,
  monthlyExpenseAvg: number,
  incomeCategories: number,
  expenseVariance: number
) {
  let score = 0;

  // 1. Savings ratio (0-30 pts)
  const savingsRatio = cashIn > 0 ? (cashIn - cashOut) / cashIn : 0;
  if (savingsRatio >= 0.3) score += 30;
  else if (savingsRatio >= 0.15) score += 22;
  else if (savingsRatio >= 0.05) score += 14;
  else if (savingsRatio >= 0) score += 6;
  else score += 0;

  // 2. Cash runway (0-25 pts) — months of expenses covered by balance
  const runway = monthlyExpenseAvg > 0 ? totalBalance / monthlyExpenseAvg : 0;
  if (runway >= 6) score += 25;
  else if (runway >= 3) score += 20;
  else if (runway >= 1) score += 12;
  else if (runway > 0) score += 5;
  else score += 0;

  // 3. Revenue diversity (0-20 pts)
  if (incomeCategories >= 4) score += 20;
  else if (incomeCategories >= 3) score += 15;
  else if (incomeCategories >= 2) score += 10;
  else if (incomeCategories >= 1) score += 5;

  // 4. Expense consistency (0-25 pts) — lower variance = better
  if (expenseVariance <= 0.15) score += 25;
  else if (expenseVariance <= 0.3) score += 18;
  else if (expenseVariance <= 0.5) score += 10;
  else score += 3;

  // Map to letter grade
  let grade: string;
  let label: string;
  let color: string;
  if (score >= 85) { grade = "A"; label = "Excellent"; color = "text-cash-in"; }
  else if (score >= 70) { grade = "B"; label = "Good"; color = "text-cash-in"; }
  else if (score >= 55) { grade = "C"; label = "Fair"; color = "text-amber-500"; }
  else if (score >= 40) { grade = "D"; label = "Needs Work"; color = "text-orange-500"; }
  else { grade = "F"; label = "At Risk"; color = "text-cash-out"; }

  return {
    score,
    grade,
    label,
    color,
    savingsRatio: Math.round(savingsRatio * 100),
    runway: Math.round(runway * 10) / 10,
    incomeCategories,
    expenseVariance: Math.round(expenseVariance * 100),
  };
}

// ─── Tax Tab Component ───
function TaxTab({
  cashIn,
  cashOut,
  allTransactions,
  selectedMonth,
  businessName,
}: {
  cashIn: number;
  cashOut: number;
  allTransactions: any[];
  selectedMonth: string;
  businessName: string;
}) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const periodDate = new Date(year, month - 1, 15);

  // Annual revenue (last 12 months from selected month)
  const annualRevenue = useMemo(() => {
    const end = endOfMonth(new Date(year, month - 1));
    const start = subMonths(startOfMonth(end), 11);
    return allTransactions
      .filter((t) => {
        const d = new Date(t.transaction_date);
        return t.type === "cash_in" && d >= start && d <= end;
      })
      .reduce((s, t) => s + Number(t.amount), 0);
  }, [allTransactions, year, month]);

  const smallCompany = isSmallCompany(annualRevenue);
  const vatCalc = calculateVATLiability(cashIn, cashOut);
  const profit = vatCalc.salesExVAT - vatCalc.purchasesExVAT;
  const devLevy = calculateDevelopmentLevy(profit > 0 ? profit : 0, smallCompany);

  // Quarterly aggregation — VAT extracted from inclusive amounts
  const quarterlyData = useMemo(() => {
    const vatFraction = CURRENT_VAT_RATE / (100 + CURRENT_VAT_RATE);
    const quarters = [];
    for (let q = 0; q < 4; q++) {
      const qStart = new Date(year, q * 3, 1);
      const qEnd = endOfMonth(new Date(year, q * 3 + 2));
      const qTxns = allTransactions.filter((t) => {
        const d = new Date(t.transaction_date);
        return d >= qStart && d <= qEnd;
      });
      const revenue = qTxns.filter((t) => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = qTxns.filter((t) => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0);
      const outputVAT = revenue * vatFraction;
      const inputVAT = expenses * vatFraction;
      quarters.push({
        label: `Q${q + 1} ${year}`,
        revenue,
        revenueExVAT: revenue - outputVAT,
        expenses,
        expensesExVAT: expenses - inputVAT,
        outputVAT,
        inputVAT,
        netVAT: outputVAT - inputVAT,
        rate: CURRENT_VAT_RATE,
      });
    }
    return quarters;
  }, [allTransactions, year]);

  const handlePrint = () => {
    printNRSReport({
      businessName,
      year,
      quarters: quarterlyData,
      annualRevenue,
      isSmallCompany: smallCompany,
      devLevy,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tax Reform Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Nigeria Tax Act 2025</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Signed into law June 26, 2025 — key rates at a glance</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TAX_REFORM_HIGHLIGHTS.map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-secondary text-center">
                <p className="text-xl font-bold">{item.rate}%</p>
                <p className="text-[10px] font-semibold mt-0.5">{item.label}</p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs font-medium mb-1.5">VAT Zero-Rated Categories</p>
            <div className="flex flex-wrap gap-1">
              {VAT_ZERO_RATED_CATEGORIES.map((cat) => (
                <Badge key={cat} variant="outline" className="text-[9px] font-normal">{cat}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Small Company Check */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Small Company Classification</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Annual Revenue (Last 12 months, incl. VAT)</p>
              <p className="text-lg font-bold">{formatNaira(annualRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Threshold: {formatNaira(SMALL_COMPANY_REVENUE_THRESHOLD)}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg text-center ${
              smallCompany ? "bg-cash-in-light text-cash-in" : "bg-secondary"
            }`}>
              <p className="text-sm font-bold">{smallCompany ? "SMALL" : "LARGE"}</p>
              <p className="text-[10px]">{smallCompany ? "CIT/CGT exempt" : "Standard rates apply"}</p>
            </div>
          </div>
          {smallCompany && (
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-secondary rounded">
              Under the Nigeria Tax Act 2025, companies with annual revenue ≤₦100M (and fixed assets &lt;₦250M) are classified as "small" and exempt from CIT, CGT, and the 4% Development Levy. VAT still applies at 7.5%.
            </p>
          )}
          {!smallCompany && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-secondary rounded-lg">
                <p className="text-[10px] text-muted-foreground">Development Levy (4%)</p>
                <p className="text-sm font-bold">{formatNaira(devLevy)}</p>
                <p className="text-[9px] text-muted-foreground">On profit of {formatNaira(profit > 0 ? profit : 0)} (ex-VAT)</p>
              </div>
              <div className="p-2.5 bg-secondary rounded-lg">
                <p className="text-[10px] text-muted-foreground">VAT Rate</p>
                <p className="text-sm font-bold">{CURRENT_VAT_RATE}%</p>
                <p className="text-[9px] text-muted-foreground">Retained — increase rejected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VAT Liability Estimator */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">VAT Liability — {getFIRSPeriod(periodDate)}</CardTitle>
          </div>
          <p className="text-[10px] text-muted-foreground">VAT extracted from recorded amounts (VAT-inclusive)</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-cash-in-light rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Output VAT</p>
                <p className="text-sm font-bold text-cash-in">{formatNaira(vatCalc.outputVAT)}</p>
                <p className="text-[9px] text-muted-foreground">from {formatNaira(cashIn)} sales</p>
              </div>
              <div className="p-3 bg-cash-out-light rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Input VAT</p>
                <p className="text-sm font-bold text-cash-out">{formatNaira(vatCalc.inputVAT)}</p>
                <p className="text-[9px] text-muted-foreground">from {formatNaira(cashOut)} purchases</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${vatCalc.netVAT >= 0 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-cash-in-light"}`}>
                <p className="text-[10px] text-muted-foreground">Net Payable</p>
                <p className={`text-sm font-bold ${vatCalc.netVAT >= 0 ? "text-amber-600 dark:text-amber-400" : "text-cash-in"}`}>
                  {vatCalc.netVAT >= 0 ? formatNaira(vatCalc.netVAT) : `(${formatNaira(Math.abs(vatCalc.netVAT))})`}
                </p>
                <p className="text-[9px] text-muted-foreground">{vatCalc.netVAT >= 0 ? "Owed to NRS" : "Refund due"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-secondary rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Revenue (ex-VAT)</p>
                <p className="text-sm font-bold">{formatNaira(vatCalc.salesExVAT)}</p>
              </div>
              <div className="p-2.5 bg-secondary rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Purchases (ex-VAT)</p>
                <p className="text-sm font-bold">{formatNaira(vatCalc.purchasesExVAT)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Amounts recorded in your cashbooks are VAT-inclusive. VAT is extracted at {CURRENT_VAT_RATE}/{100 + CURRENT_VAT_RATE} ({(CURRENT_VAT_RATE / (100 + CURRENT_VAT_RATE) * 100).toFixed(2)}%). Net amount is remitted to the Nigeria Revenue Service.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* NRS VAT Report */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">NRS VAT Report — {year}</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handlePrint}>
              <Download className="w-3 h-3 mr-1" /> Export Report
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Quarterly breakdown for Nigeria Revenue Service filing</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Period</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Rate</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Revenue (ex-VAT)</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Purchases (ex-VAT)</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Output VAT</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Input VAT</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Net VAT</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyData.map((q) => (
                  <tr key={q.label} className="border-b border-border/50">
                    <td className="py-2.5 font-medium">{q.label}</td>
                    <td className="py-2.5 text-right">{q.rate}%</td>
                    <td className="py-2.5 text-right">{formatNaira(q.revenueExVAT)}</td>
                    <td className="py-2.5 text-right">{formatNaira(q.expensesExVAT)}</td>
                    <td className="py-2.5 text-right text-cash-in">{formatNaira(q.outputVAT)}</td>
                    <td className="py-2.5 text-right text-cash-out">{formatNaira(q.inputVAT)}</td>
                    <td className={`py-2.5 text-right font-semibold ${q.netVAT >= 0 ? "text-amber-600 dark:text-amber-400" : "text-cash-in"}`}>
                      {q.netVAT >= 0 ? formatNaira(q.netVAT) : `(${formatNaira(Math.abs(q.netVAT))})`}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold border-t border-foreground/20">
                  <td className="py-2.5" colSpan={2}>Total</td>
                  <td className="py-2.5 text-right">{formatNaira(quarterlyData.reduce((s, q) => s + q.revenueExVAT, 0))}</td>
                  <td className="py-2.5 text-right">{formatNaira(quarterlyData.reduce((s, q) => s + q.expensesExVAT, 0))}</td>
                  <td className="py-2.5 text-right text-cash-in">{formatNaira(quarterlyData.reduce((s, q) => s + q.outputVAT, 0))}</td>
                  <td className="py-2.5 text-right text-cash-out">{formatNaira(quarterlyData.reduce((s, q) => s + q.inputVAT, 0))}</td>
                  <td className="py-2.5 text-right">{formatNaira(quarterlyData.reduce((s, q) => s + q.netVAT, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 p-2.5 bg-secondary rounded-lg text-[10px] text-muted-foreground space-y-1">
            <p>• VAT rate: 7.5% — extracted from VAT-inclusive amounts at 7.5/107.5</p>
            <p>• Input VAT is now fully recoverable on business purchases</p>
            <p>• FIRS has been replaced by the Nigeria Revenue Service (NRS)</p>
            <p>• Filing deadline: 21st of the month following the taxable period</p>
            <p>• Essential goods (food, healthcare, education, transport) are zero-rated</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default function ReportsPage({ selectedBusinessId }: ReportsPageProps) {
  const businessId = selectedBusinessId || undefined;
  const { data: allTransactions } = useBusinessTransactions(businessId);
  const { data: accounts } = useAccounts(businessId);
  const { data: businesses } = useBusinesses();
  const businessName = businesses?.find((b) => b.id === businessId)?.name || "My Business";
  const { isPro } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      result.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy"),
      });
    }
    return result;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  // Filter transactions by selected book, then by month
  const filteredByAccount = useMemo(() => {
    if (!allTransactions) return [];
    if (selectedAccountId === "all") return allTransactions;
    return allTransactions.filter((t) => t.account_id === selectedAccountId);
  }, [allTransactions, selectedAccountId]);

  const transactions = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return filteredByAccount.filter((t) => {
      const d = new Date(t.transaction_date);
      return d >= start && d <= end;
    });
  }, [filteredByAccount, selectedMonth]);

  // ─── Cash flow stats ───
  const cashIn = transactions.filter((t) => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0);
  const cashOut = transactions.filter((t) => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0);
  const net = cashIn - cashOut;

  // ─── Category breakdown ───
  const categoryData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      if (!map[t.category]) map[t.category] = { income: 0, expense: 0 };
      if (t.type === "cash_in") map[t.category].income += Number(t.amount);
      else map[t.category].expense += Number(t.amount);
    });
    return Object.entries(map).map(([name, vals]) => ({ name, ...vals }));
  }, [transactions]);

  const expensePieData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "cash_out").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // ─── Account balances (calculated from transactions only — opening balance txn already included) ───
  const accountBalances = useMemo(() => {
    if (!accounts || !allTransactions) return [];
    return accounts.map((acc) => {
      const txns = allTransactions.filter((t) => t.account_id === acc.id);
      const balance = txns.reduce((sum, t) => {
        return t.type === "cash_in" ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);
      return { name: acc.name, type: acc.type, balance };
    });
  }, [accounts, allTransactions]);

  const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

  // ─── 6-month trend data ───
  const trendData = useMemo(() => {
    if (!filteredByAccount.length) return [];
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthTxns = filteredByAccount.filter((t) => {
        const td = new Date(t.transaction_date);
        return td >= start && td <= end;
      });
      const income = monthTxns.filter((t) => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTxns.filter((t) => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0);
      result.push({
        month: format(d, "MMM"),
        income,
        expenses,
        net: income - expenses,
      });
    }
    return result;
  }, [filteredByAccount]);

  // ─── Health grade computation ───
  const healthGrade = useMemo(() => {
    // Monthly expense average over last 6 months
    const totalExpensesLast6 = trendData.reduce((s, m) => s + m.expenses, 0);
    const monthsWithExpenses = trendData.filter((m) => m.expenses > 0).length || 1;
    const monthlyExpenseAvg = totalExpensesLast6 / monthsWithExpenses;

    // Income category diversity this month
    const incomeCategories = new Set(
      transactions.filter((t) => t.type === "cash_in").map((t) => t.category)
    ).size;

    // Expense variance (coefficient of variation over 6 months)
    const expenseValues = trendData.map((m) => m.expenses).filter((v) => v > 0);
    let expenseVariance = 0;
    if (expenseValues.length > 1) {
      const mean = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;
      const variance = expenseValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / expenseValues.length;
      expenseVariance = mean > 0 ? Math.sqrt(variance) / mean : 0;
    }

    return computeHealthGrade(cashIn, cashOut, totalBalance, monthlyExpenseAvg, incomeCategories, expenseVariance);
  }, [cashIn, cashOut, totalBalance, transactions, trendData]);

  // ─── Income growth rate ───
  const incomeGrowth = useMemo(() => {
    if (trendData.length < 2) return null;
    const recent = trendData[trendData.length - 1].income;
    const prior = trendData[trendData.length - 2].income;
    if (prior === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - prior) / prior) * 100);
  }, [trendData]);

  // ─── Spending trend by category (top 5 expense categories over 6 months) ───
  const spendingTrend = useMemo((): { data: Record<string, any>[]; categories: string[] } => {
    if (!filteredByAccount.length) return { data: [], categories: [] };
    const catTotals: Record<string, number> = {};
    filteredByAccount.filter((t) => t.type === "cash_out").forEach((t) => {
      catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
    });
    const topCats = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const entry: Record<string, any> = { month: format(d, "MMM") };
      topCats.forEach((cat) => {
        entry[cat] = filteredByAccount
          .filter((t) => {
            const td = new Date(t.transaction_date);
            return t.type === "cash_out" && t.category === cat && td >= start && td <= end;
          })
          .reduce((s, t) => s + Number(t.amount), 0);
      });
      result.push(entry);
    }
    return { data: result, categories: topCats };
  }, [filteredByAccount]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting" subtitle="Financial health & insights">
        <Button variant="outline" size="sm" className="h-8 text-xs no-print" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Print
        </Button>
      </PageHeader>

      <div className="px-4 sm:px-6 flex items-center gap-2 no-print">
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            {accounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-4 sm:px-6 space-y-6">
        {/* ─── Health Grade Hero ─── */}
        <Card className="border-0 shadow-none bg-secondary overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Grade circle */}
              <div className="relative shrink-0">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex items-center justify-center ${
                  healthGrade.grade === "A" || healthGrade.grade === "B"
                    ? "border-cash-in"
                    : healthGrade.grade === "C"
                    ? "border-amber-400"
                    : healthGrade.grade === "D"
                    ? "border-orange-400"
                    : "border-cash-out"
                }`}>
                  <span className={`text-3xl sm:text-4xl font-black ${healthGrade.color}`}>
                    {healthGrade.grade}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Monthly Health Grade
                  </p>
                </div>
                <p className={`text-lg font-bold ${healthGrade.color}`}>{healthGrade.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {healthGrade.score}/100 — based on savings, runway, diversity & consistency.
                </p>

                {/* Breakdown chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Savings: {healthGrade.savingsRatio}%
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Runway: {healthGrade.runway}mo
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Income Sources: {healthGrade.incomeCategories}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Spend Stability: {100 - healthGrade.expenseVariance}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Summary stats ─── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-none bg-cash-in-light">
            <CardContent className="p-3 flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-cash-in shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Cash In</p>
                <p className="text-sm font-semibold text-cash-in truncate">{formatNaira(cashIn)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-cash-out-light">
            <CardContent className="p-3 flex items-center gap-2.5">
              <TrendingDown className="w-4 h-4 text-cash-out shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Cash Out</p>
                <p className="text-sm font-semibold text-cash-out truncate">{formatNaira(cashOut)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-secondary">
            <CardContent className="p-3 flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Net Cash Flow</p>
                <p className={`text-sm font-semibold truncate ${net >= 0 ? "text-cash-in" : "text-cash-out"}`}>
                  {formatNaira(net)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Tabs ─── */}
        <Tabs defaultValue="cashflow" className="no-print">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs">Accounts</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs">Tax</TabsTrigger>
          </TabsList>

          {/* ─── Cash Flow Tab ─── */}
          <TabsContent value="cashflow" className="space-y-4 mt-4">
            {categoryData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cash In vs Cash Out by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(value: number) => formatNaira(value)} />
                        <Bar dataKey="income" fill="hsl(var(--cash-in))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="expense" fill="hsl(var(--cash-out))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {expensePieData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={false}
                          >
                            {expensePieData.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatNaira(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                        {expensePieData.map((entry, idx) => {
                          const total = expensePieData.reduce((s, e) => s + e.value, 0);
                          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : "0";
                          return (
                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span>{entry.name} {pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No transactions this month.</p>
                </CardContent>
              </Card>
            )}

            {/* Top transactions */}
            {transactions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {[...transactions]
                      .sort((a, b) => Number(b.amount) - Number(a.amount))
                      .slice(0, 8)
                      .map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${tx.type === "cash_in" ? "bg-cash-in" : "bg-cash-out"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{tx.category}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {tx.description || tx.account_name} · {format(new Date(tx.transaction_date), "dd MMM")}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-medium tabular-nums shrink-0 ml-2 ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
                            {tx.type === "cash_in" ? "+" : "-"}{formatNaira(Number(tx.amount))}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Accounts Tab ─── */}
          <TabsContent value="accounts" className="space-y-4 mt-4">
            {accountBalances.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accountBalances.map((acc) => (
                    <Card key={acc.name}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{acc.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{acc.type.replace("_", " ")}</p>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${acc.balance >= 0 ? "text-cash-in" : "text-cash-out"}`}>
                          {formatNaira(acc.balance)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {accountBalances.filter((a) => a.balance > 0).length > 1 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Balance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={accountBalances.filter((a) => a.balance > 0)}
                            dataKey="balance"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {accountBalances.filter((a) => a.balance > 0).map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatNaira(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No accounts set up yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Trends Tab ─── */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            {/* Income Growth */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Income & Expenses (6 months)</CardTitle>
                  </div>
                  {incomeGrowth !== null && (
                    <Badge variant={incomeGrowth >= 0 ? "default" : "destructive"} className="text-[10px]">
                      {incomeGrowth >= 0 ? "+" : ""}{incomeGrowth}% MoM
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {trendData.some((m) => m.income > 0 || m.expenses > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(value: number) => formatNaira(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="hsl(var(--cash-in))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expenses" stroke="hsl(var(--cash-out))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center">
                    <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No data yet. Start recording transactions.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spending by category trend */}
            {spendingTrend.categories?.length > 0 && spendingTrend.data?.some((d: any) =>
              spendingTrend.categories.some((c: string) => d[c] > 0)
            ) && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Top Spending Categories (6 months)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={spendingTrend.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(value: number) => formatNaira(value)} />
                      <Legend />
                      {spendingTrend.categories.map((cat: string, idx: number) => (
                        <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[idx % COLORS.length]} radius={idx === spendingTrend.categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── Tax Tab ─── */}
          <TabsContent value="tax" className="space-y-4 mt-4">
            {!isPro ? (
              <div className="relative">
                <div className="blur-sm pointer-events-none select-none">
                  <TaxTab
                    cashIn={cashIn}
                    cashOut={cashOut}
                    allTransactions={filteredByAccount}
                    selectedMonth={selectedMonth}
                    businessName={businessName}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-card border rounded-xl p-6 text-center shadow-lg max-w-sm mx-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Tax Reports — Pro Feature</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unlock tax compliance reports, VAT calculations, and NRS filing tools.
                    </p>
                    <Button onClick={() => setUpgradeOpen(true)} className="w-full">
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <TaxTab
                cashIn={cashIn}
                cashOut={cashOut}
                allTransactions={filteredByAccount}
                selectedMonth={selectedMonth}
                businessName={businessName}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
