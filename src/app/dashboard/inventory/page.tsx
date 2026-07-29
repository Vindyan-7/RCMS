import { getInventoryItemsAction } from "@/actions/inventory";
import { InventoryClient } from "@/components/inventory/inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const itemsRes = await getInventoryItemsAction();
  const items = itemsRes.data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Inventory & Equipment Catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Equipment stock lifecycle, borrowing checkouts, condition tracking, and return processing
        </p>
      </div>

      <InventoryClient initialItems={items} />
    </div>
  );
}
