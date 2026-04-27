import localforage from "localforage";
import { TransactionInput } from "@/lib/validation/transaction";

const storage = localforage.createInstance({
  name: "cash24",
  storeName: "transaction_queue",
});

export type QueuedTransaction = {
  id: string;
  payload: TransactionInput;
  createdAt: number;
};

export async function getQueuedTransactions() {
  const items: QueuedTransaction[] = [];
  await storage.iterate<QueuedTransaction, void>((value) => {
    items.push(value);
  });
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function enqueueTransaction(payload: TransactionInput) {
  const queued: QueuedTransaction = {
    id: crypto.randomUUID(),
    payload,
    createdAt: Date.now(),
  };
  await storage.setItem(queued.id, queued);
  return queued.id;
}

export async function removeQueuedTransaction(id: string) {
  await storage.removeItem(id);
}

export async function countQueuedTransactions() {
  return storage.length();
}
