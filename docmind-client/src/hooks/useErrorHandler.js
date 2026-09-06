import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useErrorHandler = () => {
  const handleError = useCallback((error, fallbackMessage = 'Something went wrong') => {
    console.error(error);

    // Extract meaningful error message
    const msg = error?.response?.data?.message || error?.message || fallbackMessage;
    toast.error(msg);
  }, []);

  const handleSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  return { handleError, handleSuccess };
};
