import type { Disposable } from "./disposable";

/// A command is the shared action primitive behind palette entries,
/// toolbar buttons, menus, keybindings, and context actions.
export interface Command {
  id: string;
  label: string;
  keybinding?: string;
  enabled?: () => boolean;
  run(): void | Promise<void>;
}

/// Stores commands by id and executes them through their enablement
/// predicate.
export class CommandRegistry {
  private commands = new Map<string, Command>();

  /// Register or replace a command until the returned disposable is
  /// disposed.
  register(command: Command): Disposable {
    this.commands.set(command.id, command);
    return { dispose: () => void this.commands.delete(command.id) };
  }

  /// Return the currently registered commands in insertion order.
  all() {
    return [...this.commands.values()];
  }

  /// Execute a command when it exists and is currently enabled.
  execute(id: string) {
    const command = this.commands.get(id);
    if (!command || command.enabled?.() === false) return false;
    void command.run();
    return true;
  }
}
