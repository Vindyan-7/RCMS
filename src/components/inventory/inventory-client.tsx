"use client";

/**
 * Inventory Lifecycle Management System Client Component
 */

import { useState, useTransition } from "react";
import {
  createInventoryItemAction,
  updateInventoryItemAction,
  requestBorrowingAction,
  issueBorrowingAction,
  returnBorrowingAction,
  getInventoryItemsAction,
} from "@/actions/inventory";
import { InventoryItemSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Box,
  Plus,
  Handshake,
  RotateCcw,
  RefreshCw,
  Search,
  X,
  Wrench,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Tag,
} from "lucide-react";

interface InventoryClientProps {
  initialItems: InventoryItemSelect[];
}

export function InventoryClient({ initialItems }: InventoryClientProps) {
  const [itemsList, setItemsList] = useState<InventoryItemSelect[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItemSelect | null>(null);

  const [isPending, startTransition] = useTransition();

  // Form Fields - Add Item
  const [name, setName] = useState("");
  const [category, setCategory] = useState("microcontrollers");
  const [quantity, setQuantity] = useState(5);
  const [location, setLocation] = useState("Cabinet A-1");
  const [condition, setCondition] = useState("good");
  const [remarks, setRemarks] = useState("");

  // Form Fields - Borrow / Return
  const [memberId, setMemberId] = useState("");
  const [borrowQty, setBorrowQty] = useState(1);
  const [borrowingId, setBorrowingId] = useState("");
  const [returnCondition, setReturnCondition] = useState("good");

  const filteredItems = itemsList.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.location && i.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const refreshItems = async () => {
    startTransition(async () => {
      const res = await getInventoryItemsAction();
      if (res.success && res.data) {
        setItemsList(res.data.items);
      }
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createInventoryItemAction({
        name,
        category,
        quantity,
        available: quantity,
        location,
        condition,
        remarks: remarks || undefined,
      });

      if (res.success && res.data) {
        setIsAddItemOpen(false);
        setName("");
        refreshItems();
      } else {
        alert(res.error?.message || "Failed to add inventory item");
      }
    });
  };

  const handleBorrowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    startTransition(async () => {
      const res = await requestBorrowingAction({
        inventoryId: selectedItem.id,
        memberId,
        quantity: borrowQty,
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (res.success) {
        alert("Borrow request registered!");
        setIsBorrowOpen(false);
        setMemberId("");
        refreshItems();
      } else {
        alert(res.error?.message || "Borrow request failed");
      }
    });
  };

  const handleReturnItem = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await returnBorrowingAction(borrowingId, returnCondition);

      if (res.success) {
        alert("Equipment returned successfully!");
        setIsReturnOpen(false);
        setBorrowingId("");
        refreshItems();
      } else {
        alert(res.error?.message || "Return transaction failed");
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stock by asset name or cabinet location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="microcontrollers">Microcontrollers</option>
            <option value="sensors">Sensors</option>
            <option value="motors">Motors</option>
            <option value="tools">Tools</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={refreshItems} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" className="flex items-center space-x-2" onClick={() => setIsReturnOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            <span>Return Checkin</span>
          </Button>
          <Button className="flex items-center space-x-2" onClick={() => setIsAddItemOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Add Stock Asset</span>
          </Button>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{item.location || "Unassigned Storage"}</span>
                </div>
              </div>
              <Badge variant={item.available > 0 ? "success" : "destructive"}>
                {item.available} / {item.quantity} Avail
              </Badge>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3">
              <span className="capitalize">Category: {item.category}</span>
              <span className="capitalize">Condition: {item.condition}</span>
            </div>

            <Button
              size="sm"
              disabled={item.available <= 0}
              className="w-full text-xs flex items-center justify-center space-x-1"
              onClick={() => {
                setSelectedItem(item);
                setIsBorrowOpen(true);
              }}
            >
              <Handshake className="h-3.5 w-3.5" />
              <span>Checkout Item</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Add Stock Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Add Stock Asset</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddItemOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Asset Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  placeholder="e.g. ESP32 Development Board"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="microcontrollers">Microcontrollers</option>
                    <option value="sensors">Sensors</option>
                    <option value="motors">Motors</option>
                    <option value="tools">Tools</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Cabinet / Storage Location</label>
                <input
                  type="text"
                  value={location}
                  placeholder="e.g. Cabinet B-2"
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Adding Item..." : "Save Asset"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Item Modal */}
      {isBorrowOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Checkout Equipment</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsBorrowOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleBorrowItem} className="space-y-4 text-left">
              <div className="text-xs text-muted-foreground">
                Item: <span className="font-bold text-foreground">{selectedItem.name}</span> ({selectedItem.available} Available)
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Member UUID</label>
                <input
                  type="text"
                  required
                  value={memberId}
                  placeholder="Paste Member ID..."
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Checking out..." : "Authorize Checkout"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Return Item Modal */}
      {isReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Return Equipment Checkin</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsReturnOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleReturnItem} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Borrowing Transaction UUID</label>
                <input
                  type="text"
                  required
                  value={borrowingId}
                  placeholder="Paste Borrowing UUID..."
                  onChange={(e) => setBorrowingId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Condition on Return</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="good">Good / Functional</option>
                  <option value="damaged">Damaged / Requires Repair</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Processing Return..." : "Confirm Return"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
