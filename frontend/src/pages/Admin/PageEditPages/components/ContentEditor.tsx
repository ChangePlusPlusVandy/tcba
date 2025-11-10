import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ContentEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'text' | 'richtext';
  placeholder?: string;
  disabled?: boolean;
}

const ContentEditor = ({
  label,
  value,
  onChange,
  type,
  placeholder = '',
  disabled = false,
}: ContentEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'link'];

  if (type === 'text') {
    return (
      <div className='flex flex-col space-y-2 mb-6'>
        <label className='text-sm font-semibold text-gray-700'>{label}</label>
        <input
          type='text'
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
        />
      </div>
    );
  }

  return (
    <div className='flex flex-col space-y-2 mb-6'>
      <label className='text-sm font-semibold text-gray-700'>{label}</label>
      <div className='border border-gray-300 rounded-md overflow-hidden'>
        <ReactQuill
          ref={quillRef}
          theme='snow'
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          className={disabled ? 'bg-gray-100' : ''}
        />
      </div>
    </div>
  );
};

export default ContentEditor;
