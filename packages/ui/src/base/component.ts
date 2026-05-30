import { Scope, type Disposable } from "./disposable";

/// A UI unit that mounts into real DOM and registers all owned work
/// with the provided scope.
export interface Component {
  mount(root: Element, scope: Scope): void;
}

/// Mount a component into `root`, returning the scope that owns its
/// subscriptions and DOM side effects.
export function mount(component: Component, root: Element): Disposable {
  const scope = new Scope();
  component.mount(root, scope);
  return scope;
}
