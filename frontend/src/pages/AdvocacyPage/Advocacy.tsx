import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaGavel, FaUsers } from 'react-icons/fa';
import S3Image from '../../components/S3Image';
import { usePageContent } from '../../hooks/queries/usePageContent';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface AdvocacyPageProps {
  previewContent?: PageContent;
}

const AdvocacyPage = ({ previewContent }: AdvocacyPageProps = {}) => {
  const { data: pageContent } = usePageContent('advocacy');
  const content = previewContent || pageContent || {};

  useEffect(() => {
    document.title = 'Advocacy - Tennessee Coalition For Better Aging';
  }, []);

  const headerImageSrc = content['header_image']?.value || '';
  const focusImageSrc = content['focus_image']?.value || '';

  return (
    <div className='flex flex-col mt-8'>
      <section>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='bg-white px-6 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 flex items-center'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <h2 className='font-[Open_Sans] text-2xl sm:text-3xl lg:text-[40px] font-bold leading-[110%] text-gray-800 mb-4 sm:mb-6'>
                {content['header_title']?.value || 'Advocacy'}
              </h2>
              <div
                className='font-[Open_Sans] text-base sm:text-lg font-normal leading-[150%] text-gray-800'
                dangerouslySetInnerHTML={{
                  __html:
                    content['header_description']?.value ||
                    'We champion policies that strengthen aging services, support family caregivers, and protect the rights and dignity of older Tennesseans.',
                }}
              />
            </div>
          </div>
          <div className='h-[300px] sm:h-[400px] bg-slate-200 lg:mr-12 rounded-lg overflow-hidden'>
            {headerImageSrc && (
              <S3Image
                src={headerImageSrc}
                alt='Advocacy Header'
                className='w-full h-full object-cover'
              />
            )}
          </div>
        </div>
      </section>

      <section className='mt-8 bg-white px-6 sm:px-8 lg:px-20 py-12 lg:py-16'>
        <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
          <div>
            <h3 className='font-[Open_Sans] text-2xl sm:text-3xl font-bold text-gray-800 mb-4'>
              {content['focus_title']?.value || 'Our Advocacy Focus'}
            </h3>
            <div
              className='font-[Open_Sans] text-base sm:text-lg text-gray-700 leading-[160%]'
              dangerouslySetInnerHTML={{
                __html:
                  content['focus_description']?.value ||
                  'TCBA works with coalition partners and state leaders to advance policy priorities that expand access to home and community-based services, invest in the direct care workforce, and improve systems for older adults and people with disabilities.',
              }}
            />
          </div>
          <div className='h-[260px] sm:h-[320px] bg-slate-200 rounded-lg overflow-hidden'>
            {focusImageSrc && (
              <S3Image
                src={focusImageSrc}
                alt='Advocacy Focus'
                className='w-full h-full object-cover'
              />
            )}
          </div>
        </div>

        <div className='mt-12 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-50 rounded-xl p-6 text-center'>
            <FaGavel className='w-10 h-10 text-[#194B90] mx-auto mb-3' />
            <p className='font-semibold text-slate-800'>
              {content['cards_policy_title']?.value || 'Policy Development'}
            </p>
          </div>
          <div className='bg-slate-50 rounded-xl p-6 text-center'>
            <FaUsers className='w-10 h-10 text-[#194B90] mx-auto mb-3' />
            <p className='font-semibold text-slate-800'>
              {content['cards_coalition_title']?.value || 'Coalition Mobilization'}
            </p>
          </div>
          <div className='bg-slate-50 rounded-xl p-6 text-center'>
            <FaBullhorn className='w-10 h-10 text-[#194B90] mx-auto mb-3' />
            <p className='font-semibold text-slate-800'>
              {content['cards_public_title']?.value || 'Public Awareness'}
            </p>
          </div>
        </div>
      </section>

      <section className='mt-8 bg-[#194B90] text-white px-6 sm:px-8 lg:px-20 py-12'>
        <div className='max-w-4xl mx-auto text-center'>
          <h3 className='font-[Open_Sans] text-2xl sm:text-3xl font-bold mb-4'>
            {content['cta_title']?.value || 'Join Our Advocacy Efforts'}
          </h3>
          <div
            className='font-[Open_Sans] text-base sm:text-lg leading-[160%] opacity-95'
            dangerouslySetInnerHTML={{
              __html:
                content['cta_description']?.value ||
                'Partner with TCBA to help shape policies and programs that improve the lives of older Tennesseans and their families.',
            }}
          />
          <Link
            to='/register'
            className='inline-block mt-6 bg-white text-[#194B90] font-semibold px-8 py-3 rounded-full hover:opacity-90 transition'
          >
            {content['cta_button_text']?.value || 'Get Involved'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdvocacyPage;
