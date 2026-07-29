/**
 * Inventory Domain Vertical Slice Integration Test Suite
 */

import { createInventoryItemAction, updateInventoryItemAction, requestBorrowingAction, issueBorrowingAction, returnBorrowingAction, getMemberBorrowingsAction, getInventoryItemsAction } from "@/actions/inventory/inventory.actions";
import { registerMemberAction } from "@/actions/members";
import { InventoryValidator } from "@/validation/inventory";

export async function runInventoryDomainIntegrationTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    logs: [] as string[],
  };

  function assert(condition: boolean, testName: string) {
    results.total++;
    if (condition) {
      results.passed++;
      results.logs.push(`[PASS] ${testName}`);
    } else {
      results.failed++;
      results.logs.push(`[FAIL] ${testName}`);
    }
  }

  // 1. Validator Direct Unit Checks
  try {
    const validItem = await InventoryValidator.validateCreateItem({
      name: "Arduino Uno R3",
      category: "microcontrollers",
      quantity: 5,
    });
    assert(validItem.name === "Arduino Uno R3" && validItem.quantity === 5, "InventoryValidator: Parses valid item creation input");
  } catch (e) {
    assert(false, "InventoryValidator: Failed on valid input");
  }

  try {
    await InventoryValidator.validateCreateItem({
      name: "A",
      category: "",
      quantity: -2,
    });
    assert(false, "InventoryValidator: Should fail on negative quantity and short name");
  } catch (e) {
    assert(true, "InventoryValidator: Rejects negative quantity correctly");
  }

  // 2. Vertical Slice Execution
  // Register a test member
  const memberReg = await registerMemberAction({
    name: "Grace Hardware",
    email: "grace.hardware@robotics.org",
    phone: "9876543216",
    rollNumber: "26RC1008",
  });
  assert(memberReg.success === true, "Pre-requisite: Member registration succeeds");

  if (memberReg.success && memberReg.data) {
    const memberId = memberReg.data.id;

    // Create Inventory Item (Qty: 2, Available: 2)
    const createItemRes = await createInventoryItemAction({
      name: "Raspberry Pi 4 Model B (4GB)",
      category: "microcontrollers",
      quantity: 2,
      location: "Cabinet 4-B",
    });
    assert(createItemRes.success === true && createItemRes.data?.available === 2, "ServerAction: createInventoryItemAction initializes stock item");

    if (createItemRes.success && createItemRes.data) {
      const itemId = createItemRes.data.id;

      // Update Item Location
      const updateItemRes = await updateInventoryItemAction(itemId, { location: "Shelf 1-A" });
      assert(updateItemRes.success === true && updateItemRes.data?.location === "Shelf 1-A", "ServerAction: updateInventoryItemAction updates location");

      // Request Borrowing (Qty: 1)
      const requestRes = await requestBorrowingAction({
        inventoryId: itemId,
        memberId,
        quantity: 1,
      });
      assert(requestRes.success === true && requestRes.data?.status === "requested", "ServerAction: requestBorrowingAction logs borrow request");

      // Request Excessive Stock Borrowing (Qty: 5) -> Should fail LOW_STOCK
      const lowStockRes = await requestBorrowingAction({
        inventoryId: itemId,
        memberId,
        quantity: 5,
      });
      assert(lowStockRes.success === false && lowStockRes.error?.code === "LOW_STOCK", "ServerAction: Rejects borrowing request exceeding available quantity with LOW_STOCK error");

      if (requestRes.success && requestRes.data) {
        const borrowingId = requestRes.data.id;
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later

        // Issue Borrowing
        const issueRes = await issueBorrowingAction({
          borrowingId,
          dueDate: dueDate.toISOString(),
        });
        assert(issueRes.success === true && issueRes.data?.status === "issued", "ServerAction: issueBorrowingAction issues item and updates stock");

        // Verify Member Borrowing History
        const historyRes = await getMemberBorrowingsAction(memberId);
        assert(historyRes.success === true && historyRes.data?.items.length > 0, "ServerAction: getMemberBorrowingsAction returns member borrowings list");

        // Return Borrowing
        const returnRes = await returnBorrowingAction({
          borrowingId,
          conditionOnReturn: "good",
          remarks: "Returned in original working condition",
        });
        assert(returnRes.success === true && returnRes.data?.status === "returned", "ServerAction: returnBorrowingAction marks item returned and restores available quantity");
      }

      // Query All Inventory Items
      const listRes = await getInventoryItemsAction();
      assert(listRes.success === true && listRes.data?.items.length > 0, "ServerAction: getInventoryItemsAction lists items catalog");
    }
  }

  return results;
}
