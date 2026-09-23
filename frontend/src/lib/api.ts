const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api"
    : "");

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = "Something went wrong";

    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (data && typeof data === "object") {
        errorMessage = Object.entries(data)
          .map(([field, messages]) => {
            const details = Array.isArray(messages)
              ? messages.join(" ")
              : String(messages);
            return `${field}: ${details}`;
          })
          .join(" ");
      }
    } catch {
      // Response has no JSON body
    }

    throw new Error(errorMessage);
  }

  // DELETE normally returns 204 with no response body
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
