export class EventStore<T = any> extends EventTarget {
  constructor(private internalValue: T) {
    super();
  }

  get value() {
    return this.internalValue;
  }

  update(updateFn: (value: T) => T) {
    this.internalValue = updateFn(this.internalValue);
    this.dispatchEvent(new CustomEvent<T>("update", { detail: this.internalValue }));
  }
}
