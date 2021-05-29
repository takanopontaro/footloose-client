class FakeRef<T> {
  #current: T;

  constructor(initialValue: T) {
    this.#current = initialValue;
  }

  get current(): T {
    return this.#current;
  }

  set current(value: T) {
    this.#current = value;
  }
}

export { FakeRef };
