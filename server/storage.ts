// Storage interface for future features (conversion history, custom agents)
// Core MVP doesn't require persistence

export interface IStorage {
  // Placeholder for future features
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for core MVP
  }
}

export const storage = new MemStorage();
