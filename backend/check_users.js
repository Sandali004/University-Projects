import { supabase } from './utils/supabase.js';

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users found:', data);
  }
}

checkUsers();
