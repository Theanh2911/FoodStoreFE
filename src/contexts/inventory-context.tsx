"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { apiService } from '@/lib/api';

export interface InventoryEvent {
  productId: number;
  numberRemain: number;
  timestamp: number;
}

export interface InventoryState {
  [productId: number]: number | null;
}

interface InventoryContextType {
  inventory: InventoryState;
  isConnected: boolean;
  error: string | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

let globalSubscriberCount = 0;
let globalController: AbortController | null = null;
let globalShouldReconnect = false;
let globalReconnectTimeout: NodeJS.Timeout | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;
let connectDebounceTimeout: NodeJS.Timeout | null = null;

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  const connectRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Load initial inventory data on mount
  useEffect(() => {
    const loadInitialInventory = async () => {
      const result = await apiService.getTodayInventory();

      if (result.error) {
        return;
      }

      // Convert array to inventory state object
      const initialInventory: InventoryState = {};
      result.data.forEach(item => {
        initialInventory[item.productId] = item.numberRemain;
      });

      setInventory(initialInventory);
    };

    loadInitialInventory();
  }, []);

  connectRef.current = async () => {
    if (isConnecting) {
      return;
    }

    if (globalController) {
      return;
    }

    try {
      isConnecting = true;

      // Clean up any pending timeouts
      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout);
        globalReconnectTimeout = null;
      }

      globalController = new AbortController();

      const response = await fetch('https://api.yenhafood.site/api/inventory/stream', {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        },
        signal: globalController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      isConnecting = false;
      setIsConnected(true);
      setError(null);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentData = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
          const trimmedLine = normalizedLine.trim();

          if (trimmedLine.startsWith(':')) {
            continue;
          }

          if (trimmedLine.startsWith('data:')) {
            const nextChunk = trimmedLine.substring(5).replace(/^ /, '');
            currentData = currentData ? `${currentData}\n${nextChunk}` : nextChunk;
          } else if (trimmedLine === '') {
            if (currentData) {
              try {
                if (currentData === 'Connected to inventory updates' ||
                  currentData.includes('Connected')) {
                  currentData = '';
                  continue;
                }

                const eventData: InventoryEvent = JSON.parse(currentData);

                setInventory(prev => ({
                  ...prev,
                  [eventData.productId]: eventData.numberRemain
                }));

              } catch (err) {
                // Parse error ignored
              }

              currentData = '';
            }
          }
        }
      }
    } catch (error: unknown) {
      isConnecting = false;

      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Connection error';
      setError(errorMessage);
      setIsConnected(false);

      if (globalShouldReconnect && globalSubscriberCount > 0) {
        globalReconnectTimeout = setTimeout(() => {
          if (globalShouldReconnect && globalSubscriberCount > 0 && connectRef.current) {
            connectRef.current();
          }
        }, 3000);
      }
    }
  };

  const addSubscriber = useCallback(() => {
    globalSubscriberCount++;

    if (connectDebounceTimeout) {
      clearTimeout(connectDebounceTimeout);
    }

    // Debounce connection attempts - wait for all subscribers to register
    connectDebounceTimeout = setTimeout(() => {
      if (globalSubscriberCount > 0 && connectRef.current && !isConnecting && !globalController) {
        globalShouldReconnect = true;

        connectionPromise = connectRef.current();
        connectionPromise.finally(() => {
          connectionPromise = null;
        });
      }
    }, 100); // 100ms debounce

    // Force re-render to update connection status
    forceUpdate({});
  }, []);

  const removeSubscriber = useCallback(() => {
    globalSubscriberCount--;

    // Clear debounce timeout
    if (connectDebounceTimeout) {
      clearTimeout(connectDebounceTimeout);
      connectDebounceTimeout = null;
    }

    // Disconnect if no more subscribers
    if (globalSubscriberCount === 0) {
      globalShouldReconnect = false;
      isConnecting = false;
      connectionPromise = null;

      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout);
        globalReconnectTimeout = null;
      }

      if (globalController !== null) {
        const controller = globalController;
        globalController = null;
        controller.abort();
      }

      setIsConnected(false);
    }

    // Force re-render
    forceUpdate({});
  }, []);

  return (
    <InventoryContext.Provider value={{
      inventory,
      isConnected,
      error,
    }}>
      <SubscriberManager addSubscriber={addSubscriber} removeSubscriber={removeSubscriber}>
        {children}
      </SubscriberManager>
    </InventoryContext.Provider>
  );
}

function SubscriberManager({
  children,
  addSubscriber,
  removeSubscriber
}: {
  children: React.ReactNode;
  addSubscriber: () => void;
  removeSubscriber: () => void;
}) {
  return (
    <SubscriberContext.Provider value={{ addSubscriber, removeSubscriber }}>
      {children}
    </SubscriberContext.Provider>
  );
}

const SubscriberContext = createContext<{
  addSubscriber: () => void;
  removeSubscriber: () => void;
} | undefined>(undefined);

export function useInventory() {
  const context = useContext(InventoryContext);
  const subscriberContext = useContext(SubscriberContext);

  if (context === undefined || subscriberContext === undefined) {
    throw new Error('useInventory must be used within InventoryProvider');
  }

  useEffect(() => {
    // Subscribe on mount
    subscriberContext.addSubscriber();

    // Unsubscribe on unmount
    return () => {
      subscriberContext.removeSubscriber();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - MUST only run once on mount/unmount

  return context;
}
