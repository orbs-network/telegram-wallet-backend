
export interface Storage {
  storeProp(key: string, property: string, value: any): Promise<void>;
  storeObject(key: string, object: any): Promise<void>;
  read(key: string): Promise<null | Record<string, string>>;
  delete(key: string): Promise<void>;
}
