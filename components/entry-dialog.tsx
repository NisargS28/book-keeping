"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEntry, createCategory, updateEntry, deleteEntry } from "@/lib/store"
import { Category, Entry } from "@/lib/types"
import { Plus } from "lucide-react"

interface EntryDialogProps {
  bookId: string
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[] | undefined
  onEntryCreated: () => void
  entry?: Entry | null
  initialType?: "income" | "expense"
}

export function EntryDialog({ bookId, userId, open, onOpenChange, categories, onEntryCreated, entry, initialType = "expense" }: EntryDialogProps) {
  const isEditing = !!entry
  const [type, setType] = useState<"income" | "expense">("expense")
  const [description, setDescription] = useState("")
  const [people, setPeople] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [saving, setSaving] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6")
  const [savingCategory, setSavingCategory] = useState(false)
  const [localCategories, setLocalCategories] = useState<Category[]>(categories ?? [])
  const [deletingEntry, setDeletingEntry] = useState(false)

  useEffect(() => {
    setLocalCategories(categories ?? [])
  }, [categories])

  useEffect(() => {
    if (open && entry) {
      // Populate form with entry data
      setType(entry.type)
      setDescription(entry.description)
      setPeople(entry.people || "")
      setAmount(entry.amount.toString())
      setCategoryId(entry.categoryId)
      setPaymentMode(entry.paymentMode || "")
      
      // Parse local date and time from entry.occurredAt or entry.date
      const entryDate = new Date(entry.occurredAt || entry.date)
      const year = entryDate.getFullYear()
      const month = String(entryDate.getMonth() + 1).padStart(2, "0")
      const day = String(entryDate.getDate()).padStart(2, "0")
      const hours = String(entryDate.getHours()).padStart(2, "0")
      const minutes = String(entryDate.getMinutes()).padStart(2, "0")

      setDate(`${year}-${month}-${day}`)
      setTime(`${hours}:${minutes}`)
    } else if (open) {
      // Reset form for new entry with current local date/time
      setType(initialType)
      setDescription("")
      setPeople("")
      setAmount("")
      setCategoryId("")
      setPaymentMode("cash")
      
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")

      setDate(`${year}-${month}-${day}`)
      setTime(`${hours}:${minutes}`)
    }
  }, [open, entry, initialType])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setSavingCategory(true)
      const newCategory = await createCategory({
        bookId,
        name: newCategoryName,
        color: newCategoryColor,
      }, userId)
      setCategoryId(newCategory.id)
      setLocalCategories([...localCategories, newCategory])
      setNewCategoryName("")
      setNewCategoryColor("#8b5cf6")
      setShowNewCategory(false)
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleSaveEntry = async () => {
    if (!description.trim() || !amount || !categoryId || !date || !time) {
      alert("Please fill in all fields")
      return
    }

    try {
      setSaving(true)
      
      // Combine local date and time into an ISO timestamp for occurred_at
      const [y, m, d] = date.split("-").map(Number)
      const [h, min] = time.split(":").map(Number)
      const entryDateTime = new Date(y, m - 1, d, h, min, 0)
      const occurredAtIso = entryDateTime.toISOString()
      
      if (isEditing && entry) {
        await updateEntry(entry.id, entry.bookId, userId, {
          description,
          people: people.trim() || null,
          amount: parseFloat(amount),
          categoryId,
          paymentMode: paymentMode || null,
          type,
          date,
          occurredAt: occurredAtIso,
        })
      } else {
        await createEntry({
          bookId,
          userId,
          categoryId,
          description,
          people: people.trim() || null,
          amount: parseFloat(amount),
          type,
          paymentMode: paymentMode || null,
          date,
          occurredAt: occurredAtIso,
        })
      }

      setDescription("")
      setPeople("")
      setAmount("")
      setCategoryId("")
      setPaymentMode("")
      setType("expense")
      onOpenChange(false)
      onEntryCreated()
    } catch (error: any) {
      console.error("Error saving entry:", error?.message)
      alert(`Failed to save entry: ${error?.message || "Unknown error"}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!isEditing || !entry) return
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      setDeletingEntry(true)
      await deleteEntry(entry.id)
      onOpenChange(false)
      onEntryCreated()
    } catch (error) {
      console.error("Error deleting entry:", error)
      alert("Failed to delete entry")
    } finally {
      setDeletingEntry(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update the entry details" : "Create a new entry"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl bg-muted/70 p-1">
            <div className="grid grid-cols-2 gap-1">
              <Button
                type="button"
                variant={type === "income" ? "default" : "ghost"}
                className={type === "income" ? "bg-success hover:bg-success/90" : ""}
                onClick={() => setType("income")}
              >
                Cash in
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "destructive" : "ghost"}
                onClick={() => setType("expense")}
              >
                Cash out
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <Input
              placeholder="e.g., Monthly salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">People <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input
              placeholder="e.g., Rahul, Client name"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Category</label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowNewCategory(true)
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <div className="flex gap-2 flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowNewCategory(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCreateCategory()
                      }}
                      disabled={savingCategory}
                    >
                      {savingCategory ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment mode</label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteEntry}
                disabled={deletingEntry}
              >
                {deletingEntry ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button onClick={handleSaveEntry} disabled={saving || deletingEntry} className="flex-1">
              {saving ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Entry" : "Create Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
