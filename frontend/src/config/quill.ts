let registered = false;

export const registerQuillModules = async () => {
  if (registered) return;

  try {
    if (typeof window !== 'undefined') {
      const { Quill } = await import('react-quill-new');
      const ImageResize = (await import('quill-image-resize-module-react')).default;
      Quill.register('modules/imageResize', ImageResize);
      registered = true;
    }
  } catch (error) {
    console.warn('Quill modules already registered or registration failed:', error);
  }
};
