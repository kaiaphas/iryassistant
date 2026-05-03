import {
  findAdminUsers,
  findCodeItems,
  findDrivers,
  findGuides,
  findHotels,
  findRestaurants,
  findVehicles,
} from "@/repositories/mock/master-repository";

export async function getGuides() {
  return findGuides();
}

export async function getVehicles() {
  return findVehicles();
}

export async function getDrivers() {
  return findDrivers();
}

export async function getRestaurants() {
  return findRestaurants();
}

export async function getHotels() {
  return findHotels();
}

export async function getCodeItems() {
  return findCodeItems();
}

export async function getAdminUsers() {
  return findAdminUsers();
}
