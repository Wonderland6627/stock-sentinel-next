export interface UserStock {
  id: string;
  user_id: string;
  stock_code: string;
  stock_name: string | null;
  entry_date: string;
  entry_price: number;
  td9_low_price: number;
  layer_count: number;
  status: "holding" | "sold" | "stop_loss";
  sell_records: SellRecord[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellRecord {
  date: string;
  price: number;
  ratio: string;
  reason: string;
}
