import { createClient } from '@supabase/supabase-js';
import { FinancialRecord } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveRecordsToDb = async (records: FinancialRecord[]) => {
  // Map CamelCase (Frontend) to SnakeCase (Database)
  const dbRecords = records.map(r => ({
    ba: r.BA,
    monthly: r.monthly,
    act_code: r.actCode,
    amount: r.amount
  }));

  const { data, error } = await supabase
    .from('financial_records')
    .insert(dbRecords)
    .select();

  if (error) throw error;
  return data;
};

export const getRecordsFromDb = async (): Promise<FinancialRecord[]> => {
  const { data, error } = await supabase
    .from('financial_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map SnakeCase (Database) back to CamelCase (Frontend)
  return (data || []).map((r: any) => ({
    BA: r.ba,
    monthly: r.monthly,
    actCode: r.act_code,
    amount: r.amount
  }));
};