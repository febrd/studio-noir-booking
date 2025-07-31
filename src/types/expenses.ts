
export interface Expense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
  performed_by: string;
  note_file_path?: string;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}
