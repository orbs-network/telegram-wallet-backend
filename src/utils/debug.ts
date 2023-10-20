import _debug from "debug";
export const getDebug = (namespace: string) =>
  _debug(`wallet-backend:${namespace}`);
