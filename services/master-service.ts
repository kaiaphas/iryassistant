import { findCodeItems, findVehicles } from "@/repositories/mock/master-repository";
import {
  findAdminMembersFromSupabase,
  findDriversFromSupabase,
  findGuidesFromSupabase,
  findHotelsFromSupabase,
  findRestaurantsFromSupabase,
} from "@/repositories/supabase/master-repository";

export async function getGuides() {
  return findGuidesFromSupabase();
}

export async function getVehicles() {
  return findVehicles();
}

export async function getDrivers() {
  return findDriversFromSupabase();
}

export async function getRestaurants() {
  return findRestaurantsFromSupabase();
}

export async function getHotels() {
  return findHotelsFromSupabase();
}

export async function getCodeItems() {
  return findCodeItems();
}

export async function getAdminUsers() {
  return findAdminMembersFromSupabase();
}
