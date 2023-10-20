import { Storage } from "./storage";
import storage from "node-persist";

export class DiskStorage implements Storage {
  constructor() {
    storage.init();
  }
  async storeProp(key: string, property: string, value: any) {
    const currValue = (await storage.getItem(key)) ?? {};
    currValue[property] = value;
    storage.setItem(key, currValue);
  }
  async storeObject(key: string, object: any) {
    storage.setItem(key, object);
  }

  async read(key: string): Promise<null | Record<string, string>> {
    return storage.getItem(key);
  }
  async delete(key: string): Promise<void> {
    storage.removeItem(key);
  }
}
