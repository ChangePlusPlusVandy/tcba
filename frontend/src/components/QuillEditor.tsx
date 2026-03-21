import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = () => {
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (!editorWrapperRef.current) return;

    // Create Quill
    new Quill(editorWrapperRef.current, {
      modules: {
        toolbar: true,
      },
      theme: 'snow',
    });
  }, []);

  return (
    <div className='bg-white border border-[#717171] rounded-[10px] h-[270px] flex flex-col'>
      <div ref={editorWrapperRef} className='flex-1 py-4 px-8 overflow-y-auto rounded-[10px]' />
    </div>
  );
};

export default QuillEditor;
