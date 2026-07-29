"use client";

/**
 * Finance, Treasury & Sponsorship CRM Platform Client Component
 */

import { useState, useTransition } from "react";
import {
  createBudgetAction,
  getBudgetsAction,
  getFinancialSummaryAction,
  submitExpenseAction,
  approveExpenseAction,
  payExpenseAction,
  getExpensesAction,
  createSponsorAction,
  getSponsorsAction,
} from "@/actions/finance";
import { BudgetSelect, ExpenseSelect, SponsorSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  X,
  PieChart,
  Building2,
  TrendingUp,
  Receipt,
  Check,
  CreditCard,
  CheckCircle,
  Handshake,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

interface FinanceClientProps {
  initialBudgets: BudgetSelect[];
  initialExpenses: ExpenseSelect[];
  initialSponsors: SponsorSelect[];
  initialSummary: { totalIncome: number; totalExpense: number; netBalance: number };
}

export function FinanceClient({
  initialBudgets,
  initialExpenses,
  initialSponsors,
  initialSummary,
}: FinanceClientProps) {
  const [budgets, setBudgets] = useState<BudgetSelect[]>(initialBudgets);
  const [expenses, setExpenses] = useState<ExpenseSelect[]>(initialExpenses);
  const [sponsors, setSponsors] = useState<SponsorSelect[]>(initialSponsors);
  const [summary, setSummary] = useState(initialSummary);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"sponsors" | "budgets" | "expenses">("sponsors");

  // Modals
  const [isCreateSponsorOpen, setIsCreateSponsorOpen] = useState(false);
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isSubmitExpenseOpen, setIsSubmitExpenseOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Sponsor Form Fields
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorType, setSponsorType] = useState("industry_partner");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sponsorStatus, setSponsorStatus] = useState("active");
  const [sponsorNotes, setSponsorNotes] = useState("");

  // Budget Form Fields
  const [budgetName, setBudgetName] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("equipment");
  const [allocatedAmount, setAllocatedAmount] = useState(50000);

  // Expense Form Fields
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(2500);
  const [expenseCategory, setExpenseCategory] = useState("equipment");
  const [expenseVendor, setExpenseVendor] = useState("Local Hardware Store");
  const [selectedBudgetId, setSelectedBudgetId] = useState("");

  const filteredSponsors = sponsors.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBudgets = budgets.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = expenses.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const refreshData = async () => {
    startTransition(async () => {
      const [bRes, sRes, eRes, spRes] = await Promise.all([
        getBudgetsAction(),
        getFinancialSummaryAction(),
        getExpensesAction(),
        getSponsorsAction(),
      ]);
      if (bRes.success && bRes.data) setBudgets(bRes.data.items);
      if (sRes.success && sRes.data) setSummary(sRes.data);
      if (eRes.success && eRes.data) setExpenses(eRes.data.items);
      if (spRes.success && spRes.data) setSponsors(spRes.data.items);
    });
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createSponsorAction({
        name: sponsorName,
        type: sponsorType,
        contactEmail,
        contactPhone,
        status: sponsorStatus,
        notes: sponsorNotes || undefined,
      });

      if (res.success && res.data) {
        setIsCreateSponsorOpen(false);
        setSponsorName("");
        setContactEmail("");
        setContactPhone("");
        refreshData();
      } else {
        alert(res.error?.message || "Failed to register sponsor");
      }
    });
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createBudgetAction({
        name: budgetName,
        category: budgetCategory,
        allocatedAmount,
        reservedAmount: 0,
        utilizedAmount: 0,
        status: "active",
      });

      if (res.success && res.data) {
        setIsCreateBudgetOpen(false);
        setBudgetName("");
        refreshData();
      } else {
        alert(res.error?.message || "Failed to create budget");
      }
    });
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetId) {
      alert("Please select a budget pool to allocate expense");
      return;
    }

    startTransition(async () => {
      const res = await submitExpenseAction({
        budgetId: selectedBudgetId,
        title: expenseTitle,
        amount: expenseAmount,
        category: expenseCategory,
        vendor: expenseVendor,
        remarks: "Submitted via Finance Portal",
      });

      if (res.success && res.data) {
        setIsSubmitExpenseOpen(false);
        setExpenseTitle("");
        refreshData();
      } else {
        alert(res.error?.message || "Failed to submit expense");
      }
    });
  };

  const handleApproveExpense = async (id: string) => {
    startTransition(async () => {
      const res = await approveExpenseAction(id);
      if (res.success) {
        alert("Expense request approved by Treasurer/Faculty!");
        refreshData();
      } else {
        alert(res.error?.message || "Approval failed");
      }
    });
  };

  const handlePayExpense = async (id: string) => {
    startTransition(async () => {
      const res = await payExpenseAction(id);
      if (res.success) {
        alert("Payment disbursed! Budget updated and ledger transaction posted.");
        refreshData();
      } else {
        alert(res.error?.message || "Payment disbursement failed");
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Financial Summary Scorecards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Sponsorship Treasury</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-500">
            ₹{summary.totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Total Grants & Incoming Funds</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Disbursed Expenses</span>
            <Building2 className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-500">
            ₹{summary.totalExpense.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Paid Ledger Outflows</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
            <span>Net Financial Position</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            ₹{summary.netBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Treasury Net Balance</p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 border-b border-border text-sm font-semibold">
          <button
            onClick={() => setActiveTab("sponsors")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "sponsors" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Handshake className="h-4 w-4" />
            <span>Sponsors & Partners ({sponsors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("budgets")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "budgets" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <PieChart className="h-4 w-4" />
            <span>Budget Pools ({budgets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-2 px-3 flex items-center space-x-2 ${
              activeTab === "expenses" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Expense Pipeline ({expenses.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshData} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          {activeTab === "sponsors" && (
            <Button className="flex items-center space-x-2" onClick={() => setIsCreateSponsorOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Register Partner</span>
            </Button>
          )}
          {activeTab === "budgets" && (
            <Button className="flex items-center space-x-2" onClick={() => setIsCreateBudgetOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Create Budget</span>
            </Button>
          )}
          {activeTab === "expenses" && (
            <Button className="flex items-center space-x-2" onClick={() => setIsSubmitExpenseOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Submit Expense Request</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sponsors & Partners View */}
      {activeTab === "sponsors" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSponsors.map((sp) => (
            <div key={sp.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{sp.name}</h3>
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                    {sp.type.replace("_", " ")}
                  </Badge>
                </div>
                <Badge variant={sp.status === "active" ? "success" : "secondary"}>
                  {sp.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>{sp.contactEmail}</span>
                </div>
                {sp.contactPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span>{sp.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets View */}
      {activeTab === "budgets" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Budget Pool Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Allocated</th>
                <th className="px-6 py-3.5">Utilized</th>
                <th className="px-6 py-3.5">Remaining</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBudgets.map((b) => {
                const remaining = b.allocatedAmount - b.utilizedAmount;
                return (
                  <tr key={b.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{b.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground capitalize">{b.category}</td>
                    <td className="px-6 py-4 font-bold text-foreground">₹{b.allocatedAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-500 font-medium">₹{b.utilizedAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-emerald-500 font-bold">₹{remaining.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={b.status === "active" ? "success" : "secondary"}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses Pipeline View */}
      {activeTab === "expenses" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Expense Title</th>
                <th className="px-6 py-3.5">Vendor</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Approval Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground">{exp.title}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{exp.vendor || "N/A"}</td>
                  <td className="px-6 py-4 font-bold text-foreground">₹{exp.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground capitalize">{exp.category}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        exp.status === "paid"
                          ? "success"
                          : exp.status === "approved"
                          ? "info"
                          : "warning"
                      }
                    >
                      {exp.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {exp.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleApproveExpense(exp.id)}
                        disabled={isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5 text-blue-500" /> Approve
                      </Button>
                    )}
                    {exp.status === "approved" && (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => handlePayExpense(exp.id)}
                        disabled={isPending}
                      >
                        <CreditCard className="mr-1 h-3.5 w-3.5" /> Disburse Payment
                      </Button>
                    )}
                    {exp.status === "paid" && (
                      <span className="text-xs text-emerald-500 font-semibold flex items-center justify-end">
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Disbursed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Sponsor Modal */}
      {isCreateSponsorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Register Sponsor / Partner</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateSponsorOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateSponsor} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Partner / Organization Name</label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  placeholder="e.g. RoboCorp Innovations Ltd"
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Partner Type</label>
                  <select
                    value={sponsorType}
                    onChange={(e) => setSponsorType(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="industry_partner">Industry Partner</option>
                    <option value="organization">Organization</option>
                    <option value="alumni">Alumni Donor</option>
                    <option value="individual">Individual Donor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Status</label>
                  <select
                    value={sponsorStatus}
                    onChange={(e) => setSponsorStatus(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="lead">Lead</option>
                    <option value="negotiating">Negotiating</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  placeholder="sponsorships@partner.org"
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  placeholder="e.g. 9876543999"
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Registering..." : "Register Partner Record"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {isCreateBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Budget Allocation</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateBudgetOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Budget Pool Name</label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  placeholder="e.g. Microcontroller Component Pool"
                  onChange={(e) => setBudgetName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="equipment">Equipment</option>
                    <option value="event">Event</option>
                    <option value="travel">Travel</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Allocated Amount (₹)</label>
                  <input
                    type="number"
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Allocating..." : "Save Budget Allocation"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Submit Expense Modal */}
      {isSubmitExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Submit Expense Request</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsSubmitExpenseOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Expense Title</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  placeholder="e.g. Purchased Ultrasonic Sensors"
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Target Budget Pool</label>
                <select
                  required
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Budget Pool...</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Remaining: ₹{b.allocatedAmount - b.utilizedAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Vendor</label>
                  <input
                    type="text"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit Expense"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
