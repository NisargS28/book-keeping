"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEntry, createCategory, getCategories, updateEntry, deleteEntry } from "@/lib/store"
import { Category, Entry } from "@/lib/types"
import { Plus } from "lucide-react"

interface EntryDialogProps {
  bookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[] | undefined
  onEntryCreated: () => void
  entry?: Entry | null
}

export function EntryDialog({ bookId, open, onOpenChange, categories, onEntryCreated, entry }: EntryDialogProps) {
  const isEditing = !!entry
  const [type, setType] = useState<"income" | "expense">("expense")
  const [description, setDescription] = useState("")
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
      setAmount(entry.amount.toString())
      setCategoryId(entry.categoryId)
      setPaymentMode(entry.paymentMode || "")
      
      // Parse date and time from entry.date
      const entryDate = new Date(entry.date)
      setDate(entryDate.toISOString().split('T')[0])
      setTime(entryDate.toTimeString().slice(0, 5))
    } else if (open) {
      // Reset form for new entry with current date/time
      setType("expense")
      setDescription("")
      setAmount("")
      setCategoryId("")
      setPaymentMode("")
      
      const now = new Date()
      setDate(now.toISOString().split('T')[0])
      setTime(now.toTimeString().slice(0, 5))
    }
  }, [open, entry])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setSavingCategory(true)
      const newCategory = await createCategory({
        bookId,
        name: newCategoryName,
        color: newCategoryColor,
      })
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
      
      // Combine date and time into ISO string
      const dateTimeString = `${date}T${time}:00.000Z`
      
      if (isEditing && entry) {
        await updateEntry(entry.id, {
          description,
          amount: parseFloat(amount),
          categoryId,
          paymentMode: paymentMode || "",
          type,
          date: dateTimeString,
        })
      } else {
        await createEntry({
          bookId,
          categoryId,
          description,
          amount: parseFloat(amount),
          type,
          paymentMode: paymentMode || "",
          date: dateTimeString,
        })
      }

      setDescription("")
      setAmount("")
      setCategoryId("")
      setPaymentMode("")
      setType("expense")
      onOpenChange(false)
      onEntryCreated()
    } catch (error) {
      console.error("Error saving entry:", error)
      alert("Failed to save entry")
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update the entry details" : "Create a new entry"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Cash In</SelectItem>
                <SelectItem value="expense">Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="e.g., Monthly salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
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
                  onClick={() => setShowNewCategory(true)}
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
                      onClick={() => setShowNewCategory(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 text-xs"
                      onClick={handleCreateCategory}
                      disabled={savingCategory}
                    >
                      {savingCategory ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Payment Mode (Optional)</label>
            <Input
              placeholder="e.g., Cash, Card, Bank Transfer"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
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
