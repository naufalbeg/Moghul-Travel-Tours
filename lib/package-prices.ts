// A package's price table: the price per person for each kind of traveller
// (rows) in each room type (columns). Every cell is optional — the admin
// fills in what the package offers. Shared by server and client code.
//
// The keys are stored as plain text in package_prices, so adding a row
// (e.g. a child price) or a column (e.g. quad room) here needs no database
// migration.

export const TRAVELLERS = [
  { key: "ADULT", label: "Adult" },
  { key: "CHILD", label: "Child" },
] as const;

export const ROOMS = [
  { key: "TWIN", label: "Twin room", hint: "2 people per room" },
  { key: "TRIPLE", label: "Triple room", hint: "3 people per room" },
] as const;

export type TravellerKey = (typeof TRAVELLERS)[number]["key"];
export type RoomKey = (typeof ROOMS)[number]["key"];

export const TRAVELLER_KEYS = TRAVELLERS.map((t) => t.key) as [TravellerKey, ...TravellerKey[]];
export const ROOM_KEYS = ROOMS.map((r) => r.key) as [RoomKey, ...RoomKey[]];

/** One filled-in cell. Rows from the database may hold keys we no longer list. */
export type PriceCell = { traveller: string; room: string; amount: number };

/** The full grid, every cell present; null = not offered. */
export type PriceGrid = Record<TravellerKey, Record<RoomKey, number | null>>;

/** A full grid with fn(traveller, room) in every cell. */
export function buildGrid<T>(fn: (traveller: TravellerKey, room: RoomKey) => T) {
  return Object.fromEntries(
    TRAVELLER_KEYS.map((t) => [t, Object.fromEntries(ROOM_KEYS.map((r) => [r, fn(t, r)]))]),
  ) as Record<TravellerKey, Record<RoomKey, T>>;
}

/** Prisma rows (Decimal amounts) → plain numbers. */
export function toPriceCells(rows: { traveller: string; room: string; amount: { toString(): string } }[]): PriceCell[] {
  return rows.map((r) => ({ traveller: r.traveller, room: r.room, amount: Number(r.amount.toString()) }));
}

/** Filled-in cells of a grid, in display order. */
export function gridToCells(grid: PriceGrid): PriceCell[] {
  return TRAVELLER_KEYS.flatMap((traveller) =>
    ROOM_KEYS.flatMap((room) => {
      const amount = grid[traveller]?.[room];
      return typeof amount === "number" && amount > 0 ? [{ traveller, room, amount }] : [];
    }),
  );
}

/**
 * The "Starts from" price: the lowest adult price, or null. Child prices
 * never count, so a child fare is never advertised as the package price.
 */
export function startingPrice(cells: readonly PriceCell[]) {
  const adult = cells.filter((c) => c.traveller === "ADULT" && c.amount > 0).map((c) => c.amount);
  return adult.length > 0 ? Math.min(...adult) : null;
}

/**
 * The public price table: only rows and columns that have at least one
 * price. Null when the package lists no prices.
 */
export function priceTable(cells: readonly PriceCell[]) {
  const find = (traveller: string, room: string) =>
    cells.find((c) => c.traveller === traveller && c.room === room && c.amount > 0)?.amount ?? null;
  const rooms = ROOMS.filter((r) => TRAVELLERS.some((t) => find(t.key, r.key) !== null));
  const rows = TRAVELLERS.flatMap((t) => {
    const amounts = rooms.map((r) => find(t.key, r.key));
    return amounts.some((a) => a !== null) ? [{ ...t, amounts }] : [];
  });
  return rows.length > 0 ? { rooms, rows } : null;
}

/** Room types that have at least one price, in display order. */
export function offeredRooms(cells: readonly PriceCell[]): RoomKey[] {
  return ROOMS.filter((r) => cells.some((c) => c.room === r.key && c.amount > 0)).map((r) => r.key);
}

/** "ADULT.TWIN" — how the booking form names one price option. */
export const priceCellKey = (traveller: string, room: string) => `${traveller}.${room}`;

/** "Adult, Twin room" — English, for the admin portal and alert emails. */
export function optionLabel(traveller: string, room: string) {
  const t = TRAVELLERS.find((x) => x.key === traveller)?.label ?? traveller;
  const r = ROOMS.find((x) => x.key === room)?.label ?? room;
  return `${t}, ${r}`;
}

/** One line of a booking request, as priced when the customer booked. */
export type BookedTraveller = { traveller: string; room: string; count: number; amount: number };

/** Reads the travellers saved on a booking (inquiries.travellers JSON), skipping anything malformed. */
export function bookedTravellers(json: unknown): BookedTraveller[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (x): x is BookedTraveller =>
      typeof x === "object" &&
      x !== null &&
      typeof x.traveller === "string" &&
      typeof x.room === "string" &&
      Number.isInteger(x.count) &&
      typeof x.amount === "number",
  );
}
