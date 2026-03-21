import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MutatingDots } from 'react-loader-spinner';
import tcbaDDABill from '../../assets/TCBADDABill.jpeg';
import { FaHandHoldingHeart, FaUserNurse, FaHome } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';
import GoogleMap from '../../components/GoogleMap';
import S3Image from '../../components/S3Image';
import { usePageContent, useMapOrganizations } from '../../hooks/queries/usePageContent';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface AboutPageProps {
  previewContent?: PageContent;
}

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

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapOrganization {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  latitude: number;
  longitude: number;
  website: string | null;
  region: string | null;
  organizationType: string | null;
  logo?: string;
}

const AboutPage = ({ previewContent }: AboutPageProps = {}) => {
  const [showAllPartners, setShowAllPartners] = useState(false);

  const { data: pageContent } = usePageContent('about');
  const { data: mapOrgsData, isLoading: mapOrgsLoading } = useMapOrganizations();

  const content = previewContent || pageContent || {};
  const isLoadingMap = mapOrgsLoading;

  useEffect(() => {
    document.title = 'About Us - Tennessee Coalition For Better Aging';
  }, []);

  const logoMap: Record<string, string> = {
    'AARP Tennessee': aarpLogo,
    'AgeWell Middle Tennessee': agewellLogo,
    'Aging Commission of the Mid-South': agingcommissionLogo,
    "Alzheimer's Association Tennessee Chapter": alzheimersassocLogo,
    "Alzheimer's Tennessee": alzheimerstnLogo,
    'Centennial Adultcare Center': centennialadultLogo,
    'East Tennessee Human Resource Agency': ethraLogo,
    'ENCORE Ministry Foundation': encoreLogo,
    'Fifty Forward': fiftyforwardLogo,
    'First Tennessee Area Agency on Aging and Disability': firsttnaaadLogo,
    'Greater Nashville Regional Council': gnrcLogo,
    'Interfaith Dental Clinic': ifdentalLogo,
    'Mental Health America of the Mid-South': mhamidsouthLogo,
    'Mid-Cumberland Human Resource Agency': mchraLogo,
    'NASW Tennessee Chapter': naswtnLogo,
    'Northwest Tennessee Development District': nwtddLogo,
    'South Central Tennessee Development District': sctnddLogo,
    'Southeast Tennessee Area Agency on Aging and Disability': sctnaaadLogo,
    'Southwest Tennessee Development District': swtddLogo,
    'Tennessee Alliance for Legal Services': talsLogo,
    'Tennessee Association of Area Agencies on Aging and Disability': taadsLogo,
    'Tennessee Caregiver Coalition': tnccLogo,
    'Tennessee Disability Coalition': tndcLogo,
    'Tennessee Federation for the Aging': tnfdaLogo,
    'Tennessee Health Care Campaign': tnhccLogo,
    'Tennessee Justice Center': tnjcLogo,
    'Upper Cumberland Development District': ucddLogo,
    'University of Tennessee College of Social Work': utkcswLogo,
    'Vanderbilt University Medical Center': vumcLogo,
    'West End Home Foundation': wehfLogo,
  };

  const mapOrganizations = useMemo(() => {
    if (!mapOrgsData) return [];
    return mapOrgsData.map((org: MapOrganization) => ({
      ...org,
      logo: logoMap[org.name],
    }));
  }, [mapOrgsData, logoMap]);

  const missionImageSrc = content['mission_image']?.value || tcbaDDABill;

  // Coalition partners
  const coalitionRows = [
    // Row 1
    [
      {
        name: 'West End Home Foundation',
        logo: wehfLogo,
        website: 'https://www.westendhomefoundation.org/',
        featured: true,
      },
      { name: 'Tennessee Justice Center', logo: tnjcLogo, website: 'https://www.tnjustice.org' },
      {
        name: 'Tennessee Disability Coalition',
        logo: tndcLogo,
        website: 'https://www.tndisability.org',
        featured: true,
      },
      { name: 'AARP', logo: aarpLogo, website: 'https://states.aarp.org/tennessee/' },
    ],
    // Row 2
    [
      { name: 'AgeWell', logo: agewellLogo, website: 'https://agewelltn.org/' },
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
        name: 'Tennessee Federation for the Aging',
        logo: tnfdaLogo,
        website: 'http://www.tnfederationfortheaging.org/',
      },
      {
        name: 'Tennessee Health Care Campaign',
        logo: tnhccLogo,
        website: 'https://www.tnhealthcarecampaign.org',
      },
    ],
    // Row 6
    [
      { name: 'Upper Cumberland DD', logo: ucddLogo, website: 'https://www.ucdd.org' },
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
      {
        name: "Alzheimer's Tennessee",
        logo: alzheimerstnLogo,
        website: 'https://www.alztennessee.org',
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

  return (
    <div className='flex flex-col mt-8'>
      <section>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='bg-white px-6 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 flex items-center'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <h2 className='font-[Open_Sans] text-2xl sm:text-3xl lg:text-[40px] font-bold leading-[110%] text-gray-800 mb-4 sm:mb-6'>
                {content['mission_title']?.value || 'The Mission'}
              </h2>
              <div
                className='font-[Open_Sans] text-base sm:text-lg font-normal leading-[150%] text-gray-800'
                dangerouslySetInnerHTML={{
                  __html:
                    content['mission_description']?.value ||
                    'The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans and their families through partnerships that mobilize resources to educate and advocate for important policies and programs.',
                }}
              />
            </div>
          </div>
          <div className='bg-slate-300 h-[300px] sm:h-[400px] lg:mr-12 overflow-hidden rounded-lg relative group'>
            <S3Image
              src={missionImageSrc}
              fallbackSrc={tcbaDDABill}
              alt='TCBA DDA Bill'
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6'>
              <div
                className='text-white text-sm leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html:
                    content['mission_image_hover']?.value ||
                    'TCBA advocates alongside, Commissioner Brad Turner, Gov. Bill Lee, and bill sponsor, Sen. Becky Massey at the signing of the Tennessee Disability and Aging Act, legislation that merges DIDD and TCAD, creating a new Department of Disability and Aging (DDA) on April 11, 2024.',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className='mt-8 bg-white px-20 py-16'>
        <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 text-center mb-12'>
          {content['priorities_title']?.value || 'Current Priorities'}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-12 mb-10 max-w-5xl mx-auto'>
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
              <div key={num} className='flex flex-col items-center text-center space-y-6'>
                <div className='w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center'>
                  <Icon className='w-16 h-16 text-slate-700' />
                </div>
                <div className='space-y-3'>
                  <p className='text-lg font-semibold text-slate-800'>{title}</p>
                  {desc && (
                    <div
                      className='text-base text-slate-600 leading-relaxed px-2'
                      dangerouslySetInnerHTML={{ __html: desc }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className='flex justify-center'>
          <Link
            to='/advocacy'
            className='text-white px-8 py-3 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition'
            style={{ backgroundColor: '#D54242' }}
          >
            {content['priorities_button_text']?.value || 'Learn more about our advocacy'}
          </Link>
        </div>
      </section>

      <section className='mt-8 bg-white px-4 sm:px-8 lg:px-20 py-8 sm:py-12 lg:py-16'>
        <div className='text-center space-y-4 mb-8 sm:mb-12'>
          <h2 className='font-[Open_Sans] text-2xl sm:text-3xl lg:text-[40px] font-bold leading-[110%] text-gray-800'>
            Our Coalition
          </h2>
          <p className='font-[Open_Sans] text-base sm:text-lg font-normal leading-[150%] text-gray-800 max-w-3xl mx-auto px-4'>
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
                      className={`max-w-full object-contain ${partner.featured ? 'max-h-24' : 'max-h-16'}`}
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
            className='text-slate-700 px-6 py-2 rounded-full text-sm font-medium border border-slate-300 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer'
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

          {/* Google Maps showing coalition member organizations */}
          {isLoadingMap ? (
            <div className='bg-slate-300 min-h-[300px] rounded-lg flex items-center justify-center'>
              <MutatingDots
                visible={true}
                height='100'
                width='100'
                color='#D54242'
                secondaryColor='#D54242'
                radius='12.5'
                ariaLabel='mutating-dots-loading'
              />
            </div>
          ) : (
            <GoogleMap
              apiKey={GOOGLE_MAPS_API_KEY}
              markers={mapOrganizations}
              center={{ lat: 35.6775, lng: -86.1804 }}
              zoom={6.4}
              height='300px'
              className='shadow-md'
            />
          )}
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
