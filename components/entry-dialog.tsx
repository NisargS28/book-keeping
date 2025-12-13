"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCategories, createEntry, updateEntry, deleteEntry, type Entry, type Category } from "@/lib/store"
import { Trash2 } from "lucide-react"
import { format } from "date-fns"

interface EntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  type: "income" | "expense"
  entry?: Entry | null
  onSuccess: () => void
}

export function EntryDialog({ open, onOpenChange, bookId, type, entry, onSuccess }: EntryDialogProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      const cats = getCategories(bookId).filter((c) => c.type === type)
      setCategories(cats)

      // Set defaults for new entries
      if (!entry) {
        const now = new Date()
        setDate(format(now, "yyyy-MM-dd"))
        setTime(format(now, "HH:mm"))
        setDescription("")
        setAmount("")
        setNotes("")
        setPaymentMode("Cash")
        setCategoryId(cats[0]?.id || "")
      } else {
        // Load existing entry data
        const entryDate = new Date(entry.date)
        setDate(format(entryDate, "yyyy-MM-dd"))
        setTime(format(entryDate, "HH:mm"))
        setDescription(entry.description)
        setAmount(entry.amount.toString())
        setNotes(entry.notes || "")
        setPaymentMode(entry.paymentMode)
        setCategoryId(entry.categoryId)
      }
    }
  }, [open, bookId, type, entry])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!description || !amount || !categoryId) {
      alert("Please fill in all required fields")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount")
      return
    }

    const datetime = new Date(`${date}T${time}`)

    if (entry) {
      updateEntry(entry.id, {
        description,
        amount: amountNum,
        categoryId,
        paymentMode,
        date: datetime.toISOString(),
        notes,
      })
    } else {
      createEntry({
        bookId,
        type,
        description,
        amount: amountNum,
        categoryId,
        paymentMode,
        date: datetime.toISOString(),
        notes: notes || "",
      })
    }

    onSuccess()
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!entry) return

    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntry(entry.id)
      onSuccess()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : type === "income" ? "Add Cash In" : "Add Cash Out"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Remarks *</Label>
            <Input
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger id="paymentMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {entry && (
              <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className={type === "income" ? "bg-green-600 hover:bg-green-700" : ""}>
              {entry ? "Update" : "Add"} Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
