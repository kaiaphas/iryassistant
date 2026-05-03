import { adminUsers, codeItems, drivers, guides, hotels, restaurants, vehicles } from "@/lib/mock-data";

export async function findGuides() {
  return guides;
}

export async function findVehicles() {
  return vehicles;
}

export async function findDrivers() {
  return drivers;
}

export async function findRestaurants() {
  return restaurants;
}

export async function findHotels() {
  return hotels;
}

export async function findCodeItems() {
  return codeItems;
}

export async function findAdminUsers() {
  return adminUsers;
}
