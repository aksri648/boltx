import { useEffect } from 'react';
import { setScreenshotSetters, clearScreenshotSetters } from '~/lib/stores/screenshot';

interface ScreenshotStateManagerProps {
  setUploadedFiles?: (files: File[]) => void;
  setImageDataList?: (dataList: string[]) => void;
  uploadedFiles: File[];
  imageDataList: string[];
}

export const ScreenshotStateManager = ({
  setUploadedFiles,
  setImageDataList,
  uploadedFiles,
  imageDataList,
}: ScreenshotStateManagerProps) => {
  useEffect(() => {
    if (setUploadedFiles && setImageDataList) {
      setScreenshotSetters(setUploadedFiles, setImageDataList, uploadedFiles, imageDataList);
    }

    return () => {
      clearScreenshotSetters();
    };
  }, [setUploadedFiles, setImageDataList, uploadedFiles, imageDataList]);

  return null;
};
