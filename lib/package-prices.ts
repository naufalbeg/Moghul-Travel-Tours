// A package's price list: the price per person for each price type (the
// owner's list, 2026-10-06). Every type is optional — the admin fills in
// what the package offers. Shared by server and client code.
//
// Types are stored as plain text in package_price_list, so adding one here
// (e.g. Adult Quad) needs no database migration — add its wording to both
// dictionaries (prices.types) too. These English labels are the admin's.

export const PRICE_TYPES = [
  { key: "ADULT_TWIN", label: "Adult Twin", hint: "2 adults sharing a room", adult: true },
  { key: "ADULT_TRIPLE", label: "Adult Triple", hint: "3 adults sharing a room", adult: true },
  { key: "SINGLE", label: "Single", hint: "1 adult with their own room", adult: true },
  { key: "CHILD_TWIN", label: "Child Twin", hint: "Child sharing a room with 1 adult", adult: false },
  { key: "CHILD_WITH_BED", label: "Child with Bed", hint: "Extra bed, in a room with 2 adults", adult: false },
  { key: "CHILD_NO_BED", label: "Child No Bed", hint: "No bed of their own, in a room with 2 adults", adult: false },
  { key: "INFANT", label: "Infant", hint: "0–2 years old", adult: false },
] as const;

export type PriceType = (typeof PRICE_TYPES)[number]["key"];

export const PRICE_TYPE_KEYS = PRICE_TYPES.map((t) => t.key) as [PriceType, ...PriceType[]];

/** Adult prices: the ones "Starts from" uses, and a booking needs at least one of. */
export const ADULT_PRICE_TYPES: readonly PriceType[] = PRICE_TYPES.filter((t) => t.adult).map((t) => t.key);

export const isAdultPrice = (type: string) => (ADULT_PRICE_TYPES as readonly string[]).includes(type);

/** One filled-in price. Rows from the database may hold types we no longer list. */
export type PriceItem = { type: string; amount: number };

/** Every type, null = not offered. */
export type PriceList = Record<PriceType, number | null>;

/** A full list with fn(type) for every type. */
export function buildPriceList<T>(fn: (type: PriceType) => T) {
  return Object.fromEntries(PRICE_TYPE_KEYS.map((type) => [type, fn(type)])) as Record<PriceType, T>;
}

/** Prisma rows (Decimal amounts) → plain numbers. */
export function toPriceItems(rows: { type: string; amount: { toString(): string } }[]): PriceItem[] {
  return rows.map((r) => ({ type: r.type, amount: Number(r.amount.toString()) }));
}

/** Filled-in prices of a list, in display order. */
export function listToItems(list: PriceList): PriceItem[] {
  return PRICE_TYPE_KEYS.flatMap((type) => {
    const amount = list[type];
    return typeof amount === "number" && amount > 0 ? [{ type, amount }] : [];
  });
}

/**
 * The "Starts from" price: the lowest adult price, or null. Child and infant
 * prices never count, so they're never advertised as the package price.
 */
export function startingPrice(items: readonly PriceItem[]) {
  const adult = items.filter((p) => isAdultPrice(p.type) && p.amount > 0).map((p) => p.amount);
  return adult.length > 0 ? Math.min(...adult) : null;
}

/** The prices a package offers, in display order — the public price list. */
export function offeredPrices(items: readonly PriceItem[]) {
  return PRICE_TYPE_KEYS.flatMap((type) => {
    const amount = items.find((p) => p.type === type && p.amount > 0)?.amount;
    return amount ? [{ type, amount }] : [];
  });
}

/** "Child No Bed" — English, for the admin portal and alert emails. */
export const priceTypeLabel = (type: string) => PRICE_TYPES.find((t) => t.key === type)?.label ?? type;

/** One line of a booking request, as priced when the customer booked. */
export type BookedTraveller = { type: string; count: number; amount: number };

/** Reads the travellers saved on a booking (inquiries.travellers JSON), skipping anything malformed. */
export function bookedTravellers(json: unknown): BookedTraveller[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (x): x is BookedTraveller =>
      typeof x === "object" &&
      x !== null &&
      typeof x.type === "string" &&
      Number.isInteger(x.count) &&
      typeof x.amount === "number",
  );
}
