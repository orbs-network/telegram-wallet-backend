import { Storage } from "./storage";

const storage: Record<string, any> = {};

export class MemoryStorage implements Storage {
  async storeProp(key: string, property: string, value: any) {
    if (!storage[key]) storage[key] = {};
    storage[key][property] = value;
  }
  async storeObject(key: string, object: any) {
    storage[key] = object;
  }

  async read(key: string): Promise<null | Record<string, string>> {
    return storage[key];
  }
  async delete(key: string): Promise<void> {
    delete storage[key];
  }
}
