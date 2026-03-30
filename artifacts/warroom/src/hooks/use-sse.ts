import { useState, useCallback } from "react";

interface SSEOptions {
  onData?: (data: any) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = useCallback(async (url: string, body?: any, options?: SSEOptions) => {
    setIsStreaming(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          options?.onDone?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Keep the last incomplete chunk in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]') {
              options?.onDone?.();
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                options?.onDone?.();
                return;
              }
              options?.onData?.(data);
            } catch (e) {
              console.error("Failed to parse SSE data:", dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error("SSE streaming error:", error);
      options?.onError?.(error as Error);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { stream, isStreaming };
}
