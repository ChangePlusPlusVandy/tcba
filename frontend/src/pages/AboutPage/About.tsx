import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tcbaDDABill from '../../assets/TCBADDABill.jpeg';
import { FaHandHoldingHeart, FaUserNurse, FaHome } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface AboutPageProps {
  previewContent?: PageContent;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// import al logos!
import aarpLogo from '../../assets/logos/aarp.png';
import agewellLogo from '../../assets/logos/agewell.png';
import sctnddLogo from '../../assets/logos/sctndd.png';
import alzheimersassocLogo from '../../assets/logos/alzheimersassoc.png';
import alzheimerstnLogo from '../../assets/logos/alzheimerstn.png';
import centennialadultLogo from '../../assets/logos/centennialadult.png';
import ethraLogo from '../../assets/logos/ethra.png';
import encoreLogo from '../../assets/logos/encore.png';
import fiftyforwardLogo from '../../assets/logos/fiftyforward.png';
import firsttnaaadLogo from '../../assets/logos/firsttnaaad.png';
import gnrcLogo from '../../assets/logos/gnrc.png';
import ifdentalLogo from '../../assets/logos/ifdental.png';
import mhamidsouthLogo from '../../assets/logos/mhamidsouth.png';
import mchraLogo from '../../assets/logos/mchra.png';
import naswtnLogo from '../../assets/logos/naswtn.png';
import nwtddLogo from '../../assets/logos/nwtdd.png';
import sctnaaadLogo from '../../assets/logos/sctnaaad.png';
import swtddLogo from '../../assets/logos/swtdd.png';
import talsLogo from '../../assets/logos/tals.png';
import agingcommissionLogo from '../../assets/logos/agingcommission.png';
import taadsLogo from '../../assets/logos/taads.png';
import tnccLogo from '../../assets/logos/tncc.png';
import tndcLogo from '../../assets/logos/tndc.png';
import tnfdaLogo from '../../assets/logos/tnfda.png';
import tnhccLogo from '../../assets/logos/tnhcc.png';
import tnjcLogo from '../../assets/logos/tnjc.png';
import ucddLogo from '../../assets/logos/ucdd.png';
import utkcswLogo from '../../assets/logos/utkcsw.png';
import vumcLogo from '../../assets/logos/vumc.png';
import wehfLogo from '../../assets/logos/wehf.png';

// member org type
type CoalitionPartner = {
  name: string;
  logo: string;
  website: string;
};

const AboutPage = ({ previewContent }: AboutPageProps = {}) => {
  const [showAllPartners, setShowAllPartners] = useState(false);
  const [content, setContent] = useState<PageContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (previewContent) {
      setContent(previewContent);
      setLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/page-content/about`);
        if (!response.ok) throw new Error('Failed to fetch page content');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error loading page content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [previewContent]);

  // Coalition partners
  const coalitionRows = [
    // Row 1
    [
      { name: 'AARP', logo: aarpLogo, website: 'https://states.aarp.org/tennessee/' },
      { name: 'AgeWell', logo: agewellLogo, website: 'https://agewelltn.org/' },
      {
        name: 'Aging Commission of Mid South',
        logo: agingcommissionLogo,
        website: 'https://shelbycountytn.gov/3433/Aging-Commission-of-the-Mid-South',
      },
      {
        name: "Alzheimer's Association",
        logo: alzheimersassocLogo,
        website: 'https://www.alz.org',
      },
    ],
    // Row 2
    [
      {
        name: "Alzheimer's Tennessee",
        logo: alzheimerstnLogo,
        website: 'https://www.alztennessee.org',
      },
      {
        name: 'Centennial Adultcare Center',
        logo: centennialadultLogo,
        website: 'https://www.centennialadultcare.com',
      },
      {
        name: 'ethra',
        logo: ethraLogo,
        website: 'https://www.ethra.org/programs/45/area-agency-on-aging-and-disability/',
      },
      {
        name: 'ENCORE Ministry Foundation',
        logo: encoreLogo,
        website: 'https://www.encoreministry.org',
      },
    ],
    // Row 3
    [
      { name: 'Fifty Forward', logo: fiftyforwardLogo, website: 'https://www.fiftyforward.org' },
      { name: 'First TN AAAD', logo: firsttnaaadLogo, website: 'https://www.ftaaad.org/' },
      { name: 'GNRC', logo: gnrcLogo, website: 'https://www.gnrc.org' },
      {
        name: 'Interfaith Dental',
        logo: ifdentalLogo,
        website: 'https://www.interfaithdental.com',
      },
      { name: 'Mental Health America', logo: mhamidsouthLogo, website: 'https://mhamidsouth.org/' },
      { name: 'Mid-Cumberland HRA', logo: mchraLogo, website: 'https://www.mchra.com/' },
    ],
    // Row 4
    [
      { name: 'NASW Tennessee', logo: naswtnLogo, website: 'https://naswtn.socialworkers.org/' },
      { name: 'NWTDD', logo: nwtddLogo, website: 'https://www.nwtdd.org' },
      {
        name: 'AAAD Southeast Tennessee',
        logo: sctnaaadLogo,
        website: 'https://www.sctdd.org/aging-and-disability/',
      },
      { name: 'SWTDD', logo: swtddLogo, website: 'https://swtdd.org/aging-disability/' },
      { name: 'TALS', logo: talsLogo, website: 'https://www.tals.org/' },
    ],
    // Row 5
    [
      { name: 'SCTNDD', logo: sctnddLogo, website: 'https://www.sctdd.org/aging-and-disability/' },
      { name: 'TAADS', logo: taadsLogo, website: 'https://www.taads.net/' },
      {
        name: 'Tennessee Caregiver Coalition',
        logo: tnccLogo,
        website: 'https://tncaregiver.org/',
      },
      {
        name: 'Tennessee Disability Coalition',
        logo: tndcLogo,
        website: 'https://www.tndisability.org',
      },
      {
        name: 'Tennessee Federation for the Aging',
        logo: tnfdaLogo,
        website: 'http://www.tnfederationfortheaging.org/',
      },
    ],
    // Row 6
    [
      {
        name: 'Tennessee Health Care Campaign',
        logo: tnhccLogo,
        website: 'https://www.tnhealthcarecampaign.org',
      },
      { name: 'Tennessee Justice Center', logo: tnjcLogo, website: 'https://www.tnjustice.org' },
      { name: 'Upper Cumberland DD', logo: ucddLogo, website: 'https://www.ucdd.org' },
      {
        name: 'West End Home Foundation',
        logo: wehfLogo,
        website: 'https://www.westendhomefoundation.org/',
      },
    ],
    // Row 7
    [
      { name: 'UTK CSW', logo: utkcswLogo, website: 'https://csw.utk.edu/' },
      {
        name: 'Vanderbilt University Medical Center',
        logo: vumcLogo,
        website: 'https://www.vumc.org',
      },
    ],
  ];

  // show first 2 rows initially; expand upon load morepress
  const visibleRows = showAllPartners ? coalitionRows : coalitionRows.slice(0, 2);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  const missionImageSrc = content['mission_image']?.value || tcbaDDABill;

  return (
    <div className='flex flex-col mt-8'>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
                {content['mission_title']?.value || 'The Mission'}
              </h2>
              <div
                className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'
                dangerouslySetInnerHTML={{
                  __html:
                    content['mission_description']?.value ||
                    'The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans and their families through partnerships that mobilize resources to educate and advocate for important policies and programs.',
                }}
              />
            </div>
          </div>
          {/* banner image */}
          <div className='bg-slate-300 h-[400px] mr-12 overflow-hidden rounded-lg relative group'>
            <img
              src={missionImageSrc}
              alt='TCBA DDA Bill'
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6'>
              <p className='text-white text-sm leading-relaxed'>
                TCBA advocates alongside, Commissioner Brad Turner, Gov. Bill Lee, and bill sponsor, Sen. Becky Massey at the signing of the Tennessee Disability and Aging Act, legislation that merges DIDD and TCAD, creating a new Department of Disability and Aging (DDA) on April 11, 2024.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* current priorities */}
      <section className='mt-8 bg-white px-20 py-16'>
        <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 text-center mb-12'>
          {content['priorities_title']?.value || 'Current Priorities'}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10'>
          {[
            {
              num: 1,
              defaultTitle: 'Increasing Support for Family Caregivers',
              icon: FaHandHoldingHeart,
            },
            {
              num: 2,
              defaultTitle: 'Addressing the Direct Care Worker Shortage',
              icon: FaUserNurse,
            },
            {
              num: 3,
              defaultTitle:
                'Collaborating with TN Dept of Disability and Aging (TDDA) on a Multisector Plan for Aging in TN',
              icon: HiUserGroup,
            },
            {
              num: 4,
              defaultTitle:
                'Expanding Home- Community-Based Services and Supports for Aging in Community',
              icon: FaHome,
            },
          ].map(({ num, defaultTitle, icon: Icon }) => {
            const title = content[`priority${num}_title`]?.value || defaultTitle;
            const desc = content[`priority${num}_desc`]?.value || '';
            return (
              <div key={num} className='flex flex-col items-center text-center space-y-4'>
                <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center'>
                  <Icon className='w-10 h-10 text-slate-700' />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-slate-800'>{title}</p>
                  {desc && (
                    <div
                      className='text-xs text-slate-600 leading-relaxed px-2'
                      dangerouslySetInnerHTML={{ __html: desc }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className='flex justify-center'>
          <button
            className='text-white px-8 py-3 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition'
            style={{ backgroundColor: '#D54242' }}
          >
            {content['priorities_button_text']?.value || 'Learn more about our advocacy'}
          </button>
        </div>
      </section>

      {/* our coalition */}
      <section className='mt-8 bg-white px-20 py-16'>
        <div className='text-center space-y-4 mb-12'>
          <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800'>
            Our Coalition
          </h2>
          <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 max-w-3xl mx-auto'>
            Representative organizations of older Tennesseans and people with disabilities across
            the State have joined the Coalition in an effort to advocate for the communities they
            serve.
          </p>
        </div>

        {/* grid of org logos */}
        <div className='space-y-8 mb-10'>
          {visibleRows.map((row, rowIndex) => {
            const gridCols =
              row.length === 6
                ? 'lg:grid-cols-6'
                : row.length === 5
                  ? 'lg:grid-cols-5'
                  : row.length === 4
                    ? 'lg:grid-cols-4'
                    : row.length === 2
                      ? 'lg:grid-cols-2'
                      : 'lg:grid-cols-4';

            return (
              <div key={rowIndex} className={`grid grid-cols-2 sm:grid-cols-3 ${gridCols} gap-8`}>
                {row.map((partner, partnerIndex) => (
                  <a
                    key={partnerIndex}
                    href={partner.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-center p-4 hover:bg-slate-50 rounded-lg transition'
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className='max-w-full max-h-16 object-contain'
                    />
                  </a>
                ))}
              </div>
            );
          })}
        </div>

        {/* load more/less */}
        <div className='flex justify-center'>
          <button
            onClick={() => setShowAllPartners(!showAllPartners)}
            className='text-slate-700 px-6 py-2 rounded-full text-sm font-medium border border-slate-300 hover:bg-slate-50 transition flex items-center gap-2'
          >
            {showAllPartners ? 'View less' : 'View more'}
            <svg
              className={`w-4 h-4 transition-transform ${showAllPartners ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
        </div>
      </section>

      {/* tcba officers */}
      <section className='mt-8 bg-white px-20 py-16'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
          <div className='flex items-center'>
            <div className='space-y-6'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800'>
                {content['officers_title']?.value || 'TCBA Officers'}
              </h2>
              <div className='space-y-3'>
                {content['officers_cochair1']?.value && (
                  <p
                    className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'
                    dangerouslySetInnerHTML={{ __html: content['officers_cochair1'].value }}
                  />
                )}
                {content['officers_cochair2']?.value && (
                  <p
                    className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'
                    dangerouslySetInnerHTML={{ __html: content['officers_cochair2'].value }}
                  />
                )}
                {content['officers_secretary']?.value && (
                  <p
                    className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'
                    dangerouslySetInnerHTML={{ __html: content['officers_secretary'].value }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className='bg-slate-300 min-h-[300px] rounded-lg' />
        </div>

        {/* join us */}
        <div className='flex justify-center'>
          <Link
            to='/register'
            className='inline-block text-white px-8 py-3 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition'
            style={{ backgroundColor: '#D54242' }}
          >
            {content['officers_button_text']?.value || 'Join us'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
