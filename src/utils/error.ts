export interface IReturn<T = any> {
  error: Error;
  value: T;
}

export async function PromiseGuard<T = any>(
  prom: Promise<T>
): Promise<IReturn<T>> {
  try {
    let value: T = await prom;
    return Promise.resolve({ value } as IReturn<T>);
  } catch (error) {
    return Promise.resolve({ error } as IReturn<T>);
  }
}

export function Guard<T = any>(f: () => T): IReturn<T> {
  try {
    return { value: f() } as IReturn;
  } catch (error) {
    return { error } as IReturn;
  }
}
