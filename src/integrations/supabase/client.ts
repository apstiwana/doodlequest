// Decommissioned by S0.2.
//
// This module used to instantiate a Supabase client from the project URL and
// publishable key env vars. Nothing ever read from or wrote to it — the project had
// zero tables and zero migrations — so emptying it changes no behaviour, and the
// Supabase JS SDK dependency has gone with it.
//
// The file is left in place, empty, only because deleting files is Angad's call. This
// file and ./types.ts can both be deleted outright; nothing imports either.
export {};
