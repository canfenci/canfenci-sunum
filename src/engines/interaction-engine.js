export class InteractionEngine {
  #handlers = new Map();

  register(type, handler) {
    if (this.#handlers.has(type)) throw new Error(`Etkileşim zaten kayıtlı: ${type}`);
    this.#handlers.set(type, handler);
  }

  mount(definition, container, context = {}) {
    const handler = this.#handlers.get(definition.type);
    if (!handler) {
      container.textContent = `Desteklenmeyen etkileşim: ${definition.type}`;
      return () => {};
    }
    return handler.mount(definition, container, context) ?? (() => {});
  }

  has(type) {
    return this.#handlers.has(type);
  }
}
