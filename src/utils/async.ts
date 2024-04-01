export interface IReturn<T = any> {
  error: Error;
  value: T;
}

export async function Return<T = any>(prom: Promise<T>): Promise<IReturn<T>> {
  try {
    let value: T = await prom;
    return Promise.resolve({ value } as IReturn<T>);
  } catch (error) {
    return Promise.resolve({ error } as IReturn<T>);
  }
}
