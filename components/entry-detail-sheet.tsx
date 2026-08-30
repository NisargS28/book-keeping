"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Entry, Category } from "@/lib/types"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Tag,
  CreditCard,
  User,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  FileText,
  History,
} from "lucide-react"

interface EntryDetailSheetProps {
  entry: Entry | null
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => Promise<void>
}

export function EntryDetailSheet({
  entry,
  categories,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EntryDetailSheetProps) {
  const [deleting, setDeleting] = useState(false)

  if (!entry) return null

  const category = categories.find((c) => c.id === entry.categoryId)
  const isIncome = entry.type === "income"
  const entryDate = new Date(entry.occurredAt || entry.date)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) return
    try {
      setDeleting(true)
      await onDelete(entry)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting entry:", error)
      alert("Failed to delete entry")
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = () => {
    onOpenChange(false)
    onEdit(entry)
  }

  const getPaymentModeLabel = (mode: string | null) => {
    if (!mode) return "Not specified"
    const map: Record<string, string> = {
      cash: "Cash",
      upi: "UPI",
      card: "Card",
      bank_transfer: "Bank Transfer",
      other: "Other",
    }
    return map[mode] || mode.toUpperCase()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-border/80 bg-background px-4 pb-8 pt-5 sm:max-w-lg sm:mx-auto md:rounded-2xl"
      >
        <SheetHeader className="text-left pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entry Details
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                isIncome
                  ? "bg-success/15 text-success dark:bg-success/20"
                  : "bg-destructive/15 text-destructive dark:bg-destructive/20"
              }`}
            >
              {isIncome ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isIncome ? "Cash In" : "Cash Out"}
            </span>
          </div>
          <SheetTitle className="sr-only">Transaction Details</SheetTitle>
        </SheetHeader>

        {/* Hero Amount Display */}
        <div className="my-5 rounded-2xl bg-card p-5 border border-border/60 shadow-sm text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Amount</p>
          <div
            className={`text-3xl font-extrabold tracking-tight md:text-4xl ${
              isIncome ? "text-success" : "text-destructive"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(entry.amount)}
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">
            {entry.description}
          </div>
        </div>

        {/* Details Grid / List */}
        <div className="space-y-3.5 text-sm">
          {/* Category */}
          <div className="flex items-center justify-between rounded-xl bg-card/60 p-3 border border-border/40">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-medium">Category</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <span
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: category?.color || "#8b5cf6" }}
              />
              <span>{category?.name || "Uncategorized"}</span>
            </div>
          </div>

          {/* People (Optional) */}
          {entry.people && (
            <div className="flex items-center justify-between rounded-xl bg-card/60 p-3 border border-border/40">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">People</span>
              </div>
              <span className="font-semibold text-foreground bg-muted px-2.5 py-0.5 rounded-full text-xs">
                {entry.people}
              </span>
            </div>
          )}

          {/* Payment Mode */}
          <div className="flex items-center justify-between rounded-xl bg-card/60 p-3 border border-border/40">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Payment Mode</span>
            </div>
            <span className="font-semibold text-foreground capitalize">
              {getPaymentModeLabel(entry.paymentMode)}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center justify-between rounded-xl bg-card/60 p-3 border border-border/40">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Date & Time</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                {format(entryDate, "EEE, MMM dd, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                <Clock className="h-3 w-3" />
                {format(entryDate, "hh:mm a")}
              </div>
            </div>
          </div>

          {/* Running Balance */}
          <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 border border-border/60">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <History className="h-4 w-4 text-primary" />
              <span className="font-medium">Running Balance</span>
            </div>
            <span className="font-bold text-foreground">
              {formatCurrency(entry.runningBalance)}
            </span>
          </div>

          {/* Notes if present */}
          {entry.notes && (
            <div className="rounded-xl bg-card/60 p-3 border border-border/40 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-xs text-foreground/90 pl-6">{entry.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 text-[11px] text-muted-foreground/70 space-y-1">
            <div className="flex justify-between">
              <span>Created</span>
              <span>
                {entry.createdAt
                  ? format(new Date(entry.createdAt), "MMM dd, yyyy HH:mm")
                  : "—"}
              </span>
            </div>
            {entry.updatedAt && (
              <div className="flex justify-between">
                <span>Last updated</span>
                <span>
                  {format(new Date(entry.updatedAt), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 border-border/80"
            onClick={handleEdit}
            disabled={deleting}
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 gap-2"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
