import { useEffect, useState, useRef } from 'react';

export interface InventoryEvent {
  productId: number;
  numberRemain: number;
  timestamp: number;
}

export interface InventoryState {
  [productId: number]: number | null;
}

export function useInventoryStream() {
  const [inventory, setInventory] = useState<InventoryState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = async () => {
      try {
        controllerRef.current = new AbortController();

        const response = await fetch('https://api.yenhafood.site/api/inventory/stream', {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
          },
          signal: controllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
        }

        setIsConnected(true);
        setError(null);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let currentData = '';

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Inventory stream disconnected');
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
            const trimmedLine = normalizedLine.trim();

            // Ignore SSE comments
            if (trimmedLine.startsWith(':')) {
              continue;
            }

            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.substring(6).trim();
            } else if (trimmedLine.startsWith('data:')) {
              const nextChunk = trimmedLine.substring(5).replace(/^ /, '');
              currentData = currentData ? `${currentData}\n${nextChunk}` : nextChunk;
            } else if (trimmedLine === '') {
              // End of SSE message
              if (currentData) {
                try {
                  // Skip connection messages
                  if (currentData === 'Connected to inventory updates' || 
                      currentData.includes('Connected')) {
                    currentEvent = '';
                    currentData = '';
                    continue;
                  }

                  const eventData: InventoryEvent = JSON.parse(currentData);
                  
                  // Update inventory state for this product
                  setInventory(prev => ({
                    ...prev,
                    [eventData.productId]: eventData.numberRemain
                  }));

                } catch (err) {
                  console.error('Failed to parse inventory event:', err, currentData);
                }

                // Reset for next message
                currentEvent = '';
                currentData = '';
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Inventory stream aborted');
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Connection error';
        setError(errorMessage);
        setIsConnected(false);

        // Reconnect after 3 seconds
        if (shouldReconnectRef.current) {
          console.log('Reconnecting to inventory stream in 3s...');
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, 3000);
        }
      }
    };

    connect();

    // Cleanup
    return () => {
      shouldReconnectRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { inventory, isConnected, error };
}
