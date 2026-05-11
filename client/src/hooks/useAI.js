import { useState } from "react";

const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callAI = async (apiFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      return result.data;
    } catch (err) {
      const msg =
        err?.response?.data?.error || "Something went wrong. Try again.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, callAI };
};

export default useAI;