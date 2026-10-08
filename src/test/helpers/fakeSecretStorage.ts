/** Obvious test credentials only; never uses the VS Code encrypted store. */
export class FakeSecretStorage {
    readonly values = new Map<string, string>();
    async get(key: string): Promise<string | undefined> { return this.values.get(key); }
    async store(key: string, value: string): Promise<void> { this.values.set(key, value); }
    async delete(key: string): Promise<void> { this.values.delete(key); }
}
