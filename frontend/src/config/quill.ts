import { Quill } from 'react-quill-new';
import ImageResize from 'quill-image-resize-module-react';

let registered = false;

export const registerQuillModules = () => {
  if (registered) return;

  try {
    if (typeof window !== 'undefined') {
      Quill.register('modules/imageResize', ImageResize);
      registered = true;
    }
  } catch (error) {
    console.warn('Quill modules already registered or registration failed:', error);
  }
};
