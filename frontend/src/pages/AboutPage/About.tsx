import { useState } from 'react';
import { Link } from 'react-router-dom';

// import al logos!
import aarpLogo from '../../assets/logos/coalition/aarp.png';
import agewellLogo from '../../assets/logos/coalition/agewell.png';
import sctnddLogo from '../../assets/logos/coalition/sctndd.png';
import alzheimersassocLogo from '../../assets/logos/coalition/alzheimersassoc.png';
import alzheimerstnLogo from '../../assets/logos/coalition/alzheimerstn.png';
import centennialadultLogo from '../../assets/logos/coalition/centennialadult.png';
import ethraLogo from '../../assets/logos/coalition/ethra.png';
import encoreLogo from '../../assets/logos/coalition/encore.png';
import fiftyforwardLogo from '../../assets/logos/coalition/fiftyforward.png';
import firsttnaaadLogo from '../../assets/logos/coalition/firsttnaaad.png';
import gnrcLogo from '../../assets/logos/coalition/gnrc.png';
import ifdentalLogo from '../../assets/logos/coalition/ifdental.png';
import mhamidsouthLogo from '../../assets/logos/coalition/mhamidsouth.png';
import mchraLogo from '../../assets/logos/coalition/mchra.png';
import naswtnLogo from '../../assets/logos/coalition/naswtn.png';
import nwtddLogo from '../../assets/logos/coalition/nwtdd.png';
import sctnaaadLogo from '../../assets/logos/coalition/sctnaaad.png';
import swtddLogo from '../../assets/logos/coalition/swtdd.png';
import talsLogo from '../../assets/logos/coalition/tals.png';
import agingcommissionLogo from '../../assets/logos/coalition/agingcommission.png';
import taadsLogo from '../../assets/logos/coalition/taads.png';
import tnccLogo from '../../assets/logos/coalition/tncc.png';
import tndcLogo from '../../assets/logos/coalition/tndc.png';
import tnfdaLogo from '../../assets/logos/coalition/tnfda.png';
import tnhccLogo from '../../assets/logos/coalition/tnhcc.png';
import tnjcLogo from '../../assets/logos/coalition/tnjc.png';
import ucddLogo from '../../assets/logos/coalition/ucdd.png';
import utkcswLogo from '../../assets/logos/coalition/utkcsw.png';
import vumcLogo from '../../assets/logos/coalition/vumc.png';
import wehfLogo from '../../assets/logos/coalition/wehf.png';

// member org type
type CoalitionPartner = {
  name: string;
  logo: string;
  website: string;
};

const AboutPage = () => {
  const [showAllPartners, setShowAllPartners] = useState(false);

  // cur priorities data
  const priorities = [
    {
      title: 'Increasing Support for Family Caregivers',
    },
    {
      title: 'Addressing the Direct Care Worker Shortage',
    },
    {
      title: 'Expanding Home-Community Based Services and Supports for Aging in Community',
    },
    {
      title: 'Collaborating with TN Dept of Disability and Aging (TDDA) on a Multisector Plan for Aging in TN',
    },
  ];

  // Coalition partners
  const coalitionRows = [
    // Row 1
    [
      { name: 'AARP', logo: aarpLogo, website: 'https://states.aarp.org/tennessee/' },
      { name: 'AgeWell', logo: agewellLogo, website: 'https://agewelltn.org/' },
      { name: 'Aging Commission of Mid South', logo: agingcommissionLogo, website: 'https://shelbycountytn.gov/3433/Aging-Commission-of-the-Mid-South' },
      { name: "Alzheimer's Association", logo: alzheimersassocLogo, website: 'https://www.alz.org' },
    ],
    // Row 2 
    [
      { name: "Alzheimer's Tennessee", logo: alzheimerstnLogo, website: 'https://www.alztennessee.org' },
      { name: 'Centennial Adultcare Center', logo: centennialadultLogo, website: 'https://www.centennialadultcare.com' },
      { name: 'ethra', logo: ethraLogo, website: 'https://www.ethra.org/programs/45/area-agency-on-aging-and-disability/' },
      { name: 'ENCORE Ministry Foundation', logo: encoreLogo, website: 'https://www.encoreministry.org' },
    ],
    // Row 3
    [
      { name: 'Fifty Forward', logo: fiftyforwardLogo, website: 'https://www.fiftyforward.org' },
      { name: 'First TN AAAD', logo: firsttnaaadLogo, website: 'https://www.ftaaad.org/' },
      { name: 'GNRC', logo: gnrcLogo, website: 'https://www.gnrc.org' },
      { name: 'Interfaith Dental', logo: ifdentalLogo, website: 'https://www.interfaithdental.com' },
      { name: 'Mental Health America', logo: mhamidsouthLogo, website: 'https://mhamidsouth.org/' },
      { name: 'Mid-Cumberland HRA', logo: mchraLogo, website: 'https://www.mchra.com/' },
    ],
    // Row 4 
    [
      { name: 'NASW Tennessee', logo: naswtnLogo, website: 'https://naswtn.socialworkers.org/' },
      { name: 'NWTDD', logo: nwtddLogo, website: 'https://www.nwtdd.org' },
      { name: 'AAAD Southeast Tennessee', logo: sctnaaadLogo, website: 'https://www.sctdd.org/aging-and-disability/' },
      { name: 'SWTDD', logo: swtddLogo, website: 'https://swtdd.org/aging-disability/' },
      { name: 'TALS', logo: talsLogo, website: 'https://www.tals.org/' },
    ],
    // Row 5 
    [
      { name: 'SCTNDD', logo: sctnddLogo, website: 'https://www.sctdd.org/aging-and-disability/' },
      { name: 'TAADS', logo: taadsLogo, website: 'https://www.taads.net/' },
      { name: 'Tennessee Caregiver Coalition', logo: tnccLogo, website: 'https://tncaregiver.org/' },
      { name: 'Tennessee Disability Coalition', logo: tndcLogo, website: 'https://www.tndisability.org' },
      { name: 'Tennessee Federation for the Aging', logo: tnfdaLogo, website: 'http://www.tnfederationfortheaging.org/' },
    ],
    // Row 6 
    [
      { name: 'Tennessee Health Care Campaign', logo: tnhccLogo, website: 'https://www.tnhealthcarecampaign.org' },
      { name: 'Tennessee Justice Center', logo: tnjcLogo, website: 'https://www.tnjustice.org' },
      { name: 'Upper Cumberland DD', logo: ucddLogo, website: 'https://www.ucdd.org' },
      { name: 'West End Home Foundation', logo: wehfLogo, website: 'https://www.westendhomefoundation.org/' },
    ],
    // Row 7
    [
      { name: 'UTK CSW', logo: utkcswLogo, website: 'https://csw.utk.edu/' },
      { name: 'Vanderbilt University Medical Center', logo: vumcLogo, website: 'https://www.vumc.org' },
    ],
  ];

  // show first 2 rows initially; expand upon load morepress
  const visibleRows = showAllPartners ? coalitionRows : coalitionRows.slice(0, 2);

  return (
    <div className='flex flex-col'>
      <section className='relative w-screen left-1/2 -translate-x-1/2 overflow-hidden'>
        <div className='grid grid-cols-1 lg:grid-cols-2 min-h-[400px]'>
          <div className='bg-white px-8 sm:px-12 lg:px-16 py-16 lg:py-20 flex items-center'>
            <div className='max-w-xl space-y-6'>
              <h2 className='text-4xl font-semibold text-slate-900'>The Mission</h2>
              <p className='text-base text-slate-700 leading-relaxed'>
              The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans 
              and their families through partnerships that mobilize resources to educate and advocate for important 
              policies and programs.
              </p>
            </div>
          </div>
          {/* placeholder image (gray for now!) */}
          <div className='bg-slate-300 min-h-[400px]' />
        </div>
      </section>

      {/* current priorities */}
      <section className='max-w-7xl mx-auto px-6 sm:px-10 py-16 lg:py-20 w-full'>
        <h2 className='text-4xl font-semibold text-slate-900 text-center mb-12'>
          Current Priorities
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10'>
          {priorities.map((priority, index) => (
            <div key={index} className='flex flex-col items-center text-center space-y-4'>
              {/* icon image (gray for now!) */}
              <div className='w-20 h-20 bg-slate-300 rounded' />
              <p className='text-sm text-slate-800 leading-relaxed px-2'>{priority.title}</p>
            </div>
          ))}
        </div>
        <div className='flex justify-center'>
          <button
            className='text-white px-8 py-3 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition'
            style={{ backgroundColor: '#D54242' }}
          >
            Learn more about our advocacy
          </button>
        </div>
      </section>

      {/* our coalition */}
      <section className='max-w-7xl mx-auto px-6 sm:px-10 py-16 lg:py-20 w-full'>
        <div className='text-center space-y-4 mb-12'>
          <h2 className='text-4xl font-semibold text-slate-900'>Our Coalition</h2>
          <p className='text-base text-slate-600 max-w-3xl mx-auto'>
            Representative organizations of older Tennesseans and people with disabilities across
            the State have joined the Coalition in an effort to advocate for the communities they
            serve.
          </p>
        </div>

        {/* grid of org logos */}
        <div className='space-y-8 mb-10'>
          {visibleRows.map((row, rowIndex) => {
            const gridCols = row.length === 6 ? 'lg:grid-cols-6' :
                           row.length === 5 ? 'lg:grid-cols-5' :
                           row.length === 4 ? 'lg:grid-cols-4' :
                           row.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-4';

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
            {showAllPartners ? 'Load less' : 'Load more'}
            <svg
              className={`w-4 h-4 transition-transform ${showAllPartners ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
        </div>
      </section>

      {/* tcba officers */}
      <section className='max-w-7xl mx-auto px-6 sm:px-10 py-16 w-full'>
        <h2 className='text-3xl font-semibold text-slate-900 mb-8'>TCBA Officers</h2>
        <div className='space-y-3 text-slate-700'>
          <p>
            <span className='font-semibold'>Co-Chair:</span> James Powers, MD - Vanderbilt Univ.
            Medical Center
          </p>
          <p>
            <span className='font-semibold'>Co-chair:</span> Grace Sutherland Smith, LMSW -
            AgeWell Middle TN
          </p>
          <p>
            <span className='font-semibold'>Secretary:</span> Donna DeStefano - TN Disability
            Coalition
          </p>
        </div>

        {/* join us */}
        <div className='mt-12 flex justify-center'>
          <Link
            to='/register'
            className='inline-block text-white px-8 py-3 rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition'
            style={{ backgroundColor: '#D54242' }}
          >
            Join us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
