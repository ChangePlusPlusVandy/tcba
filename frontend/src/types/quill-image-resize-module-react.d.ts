declare module 'quill-image-resize-module-react' {
  import { Quill } from 'react-quill';

  interface ImageResizeOptions {
    modules?: string[];
    overlayStyles?: Record<string, string>;
    handleStyles?: Record<string, string>;
    displayStyles?: Record<string, string>;
  }

  class ImageResize {
    constructor(quill: Quill, options?: ImageResizeOptions);
  }

  export default ImageResize;
}
