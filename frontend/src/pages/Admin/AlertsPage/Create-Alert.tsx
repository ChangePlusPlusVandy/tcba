import React, { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';
import Quill from 'quill';

const CreateAlert = () => {
  const [loading, setLoading] = useState(false); //TODO: handle loading in the form submission

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex flex-col p-8 space-y-8 w-full'>
        <a href='/admin/alerts' className='w-fit h-[18px]'>
          <svg
            width='11'
            height='19'
            viewBox='0 0 11 19'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='M9.70728 0.345703L0.707275 9.74869L9.70728 18.3457' stroke='#3C3C3C' />
          </svg>
        </a>

        <h1 className='text-[30px] font-font-semibold text-[#3C3C3C]'>Create Alert</h1>

        <form className='flex flex-col px-4 space-y-6 text-[18px] leading-[25px] text-[#3C3C3C]'>
          <div className='flex flex-col space-y-2'>
            <label>Title</label>
            <input
              type='text'
              className='p-4 h-12 bg-white border-[1px] border-[#717171] rounded-[10px]'
            />
          </div>
          <div className='flex flex-col space-y-2'>
            <label>Content</label>
            {/* <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
                        <script>
                            const quill = new Quill('#editor', {
                                modules: {
                                    toolbar: true,
                                },
                                theme: 'snow'
                            });
                        </script> */}
          </div>

          <div className='flex justify-center items-center space-x-8'>
            {/* TODO: handle drafts */}
            <button className='w-[150px] h-[50px] border-[1px] border-gray-300 rounded-[15px] bg-white text-black hover:bg-gray-50 transition disabled:bg-gray-400 disabled:cursor-not-allowed'>
              Save Draft
            </button>
            <button
              type='submit'
              className='w-[110px] h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlert;
