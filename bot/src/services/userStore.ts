interface UserContext {
  action: "deposit" | "withdraw";
  vault: string;
}

interface UserData {
  wallet?: string;
  context?: UserContext;
  preferences?: {
    riskTolerance?: "low" | "medium" | "high";
    notifications?: boolean;
  };
}

export class UserStore {
  private users: Map<string, UserData> = new Map();

  getUser(userId: string): UserData {
    if (!this.users.has(userId)) {
      this.users.set(userId, {});
    }
    return this.users.get(userId)!;
  }

  setWallet(userId: string, wallet: string): void {
    const user = this.getUser(userId);
    user.wallet = wallet;
    this.users.set(userId, user);
  }

  getWallet(userId: string): string | undefined {
    return this.getUser(userId).wallet;
  }

  removeWallet(userId: string): void {
    const user = this.getUser(userId);
    delete user.wallet;
    this.users.set(userId, user);
  }

  setContext(userId: string, context: UserContext): void {
    const user = this.getUser(userId);
    user.context = context;
    this.users.set(userId, user);
  }

  getContext(userId: string): UserContext | undefined {
    return this.getUser(userId).context;
  }

  clearContext(userId: string): void {
    const user = this.getUser(userId);
    delete user.context;
    this.users.set(userId, user);
  }

  setPreferences(
    userId: string,
    preferences: UserData["preferences"]
  ): void {
    const user = this.getUser(userId);
    user.preferences = { ...user.preferences, ...preferences };
    this.users.set(userId, user);
  }

  getPreferences(userId: string): UserData["preferences"] {
    return this.getUser(userId).preferences;
  }
}
