/**
 * Centralized State Management
 * Simple event-driven state manager for the application
 */

type StateChangeListener = (state: AppState) => void;

export interface AppState {
  isEditMode: boolean;
  currentFilePath: string | null;
  rootDirectory: string | null;
  selectedTreeNode: HTMLElement | null;
  editorScrollTop: number;
  editorSelectionStart: number;
  editorSelectionEnd: number;
  previewScrollTop: number;
  previewCursorOffset: number;
  previewHoverLine: number;
  isExplorerVisible: boolean;
  isLocalSearchVisible: boolean;
  isGlobalSearchVisible: boolean;
  // Track if we're in the middle of a mode switch
  isModeSwitching: boolean;
}

class StateManager {
  private state: AppState;
  private listeners: Set<StateChangeListener> = new Set();

  constructor() {
    this.state = {
      isEditMode: false,
      currentFilePath: null,
      rootDirectory: null,
      selectedTreeNode: null,
      editorScrollTop: 0,
      editorSelectionStart: 0,
      editorSelectionEnd: 0,
      previewScrollTop: 0,
      previewCursorOffset: 0,
      previewHoverLine: -1,
      isExplorerVisible: true,
      isLocalSearchVisible: false,
      isGlobalSearchVisible: false,
      isModeSwitching: false,
    };
  }

  /**
   * Get current state
   */
  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates: Partial<AppState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get specific state value
   */
  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  /**
   * Set specific state value
   */
  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    this.setState({ [key]: value } as Partial<AppState>);
  }
}

// Export singleton instance
export const stateManager = new StateManager();
