import { atom } from 'nanostores';

// Module-level shared state for screenshot/image upload management
// This replaces the window.__BOLT_* globals previously used by ScreenshotStateManager and ScreenshotSelector

export interface ScreenshotState {
  uploadedFiles: File[];
  imageDataList: string[];
}

// Module-level state (File objects can't be stored in nanostores atom directly)
const _state: ScreenshotState = {
  uploadedFiles: [],
  imageDataList: [],
};

// Callback setters — set once by ScreenshotStateManager, used by ScreenshotSelector
type FileSetter = (files: File[]) => void;
type ImageSetter = (dataList: string[]) => void;

let _setUploadedFiles: FileSetter | null = null;
let _setImageDataList: ImageSetter | null = null;

export const screenshotState = atom<ScreenshotState>({
  uploadedFiles: [],
  imageDataList: [],
});

export function setScreenshotSetters(
  setFiles: FileSetter,
  setImages: ImageSetter,
  currentFiles: File[],
  currentImages: string[],
) {
  _setUploadedFiles = setFiles;
  _setImageDataList = setImages;
  _state.uploadedFiles = currentFiles;
  _state.imageDataList = currentImages;
  screenshotState.set({ uploadedFiles: currentFiles, imageDataList: currentImages });
}

export function clearScreenshotSetters() {
  _setUploadedFiles = null;
  _setImageDataList = null;
}

export function addScreenshot(file: File, base64Image: string): boolean {
  if (!_setUploadedFiles || !_setImageDataList) {
    return false;
  }

  const newFiles = [..._state.uploadedFiles, file];
  const newImages = [..._state.imageDataList, base64Image];

  _setUploadedFiles(newFiles);
  _setImageDataList(newImages);
  _state.uploadedFiles = newFiles;
  _state.imageDataList = newImages;
  screenshotState.set({ uploadedFiles: newFiles, imageDataList: newImages });

  return true;
}
