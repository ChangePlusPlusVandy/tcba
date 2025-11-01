import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/home.jpg';

type Announcement = {
  id: string;
  title: string;
  content: string;
  publishedDate?: string | null;
  isPublished?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const howWeWorkItems = [
  {
    title: 'Partnership',
    description:
      'We are a grassroots, member-led coalition and invite member organizations to partner in advancing solutions to key issues impacting older adults and their families.',
  },
  {
    title: 'Advocacy',
    description:
      'Our voices are stronger together and TCBA allows us to join forces around key issues and advocate for and with older adults and their families. Click here to learn more about our priorities and members.',
  },
  {
    title: 'Outreach',
    description:
      'We engage key stakeholders through education and discussions to inform our collective advocacy, and we conduct outreach to state leaders to help shape policies, service delivery and new initiatives.',
  },
];

const whyWeWorkItems = [
  {
    title: 'Fastest Growing Age Group',
    description:
      "TN's older adult population (65+) is the fastest growing age group. The 80+ population, those most likely to have multiple chronic conditions, will double by 2040.",
  },
  {
    title: 'Inadequate LTSS in Tennessee',
    description:
      'Someone turning 65 today has a nearly 70% chance of needing some long-term services and supports (LTSS) in their remaining years yet TN ranks 47th among states in LTSS overall.',
  },
  {
    title: 'Lack of Family Caregiver Support',
    description:
      'Families provide at least 80% of long-term care yet TN ranks 51st among all the states for support of family caregivers.',
  },
];

const HomePage = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements`);
        if (!response.ok) throw new Error(`Failed to fetch announcements: ${response.statusText}`);
        const data: Announcement[] = await response.json();
        const publishedFirst =
          data.find(item => item.isPublished) ?? (data.length ? data[0] : null);
        if (isMounted) {
          setAnnouncement(publishedFirst ?? null);
        }
      } catch (error) {
        console.error('Error loading announcements banner:', error);
        if (isMounted) setAnnouncement(null);
      }
    };

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className='flex flex-col gap-16 pb-20'>
      {announcement && (
        <section className='bg-rose-100 border border-rose-200/80 shadow-sm rounded-3xl px-6 sm:px-10 py-6'>
          <div className='max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8'>
            <div className='flex-1 space-y-3'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-wide text-rose-900'>
                  Announcements
                </p>
                {announcement.publishedDate && (
                  <p className='text-xs text-rose-900/70'>
                    {new Date(announcement.publishedDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <h2 className='text-xl font-semibold text-rose-950'>{announcement.title}</h2>
                <p className='text-base text-rose-900/90 leading-relaxed'>{announcement.content}</p>
              </div>
            </div>
            <Link
              to='/announcements'
              className='self-start lg:self-auto text-white px-5 py-2 rounded-full text-sm font-semibold shadow transition'
              style={{ backgroundColor: '#D54242' }}
            >
              Read More
            </Link>
          </div>
        </section>
      )}

      <section className='relative min-h-[420px] w-screen left-1/2 -translate-x-1/2 overflow-hidden'>
        <img
          src={heroImage}
          alt='Hands providing support'
          className='absolute inset-0 w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-slate-950/60' />
        <div className='relative max-w-6xl mx-auto px-6 sm:px-10 pt-24 pb-24 lg:pt-32 lg:pb-28'>
          <div className='max-w-2xl text-white space-y-6'>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-[70%]'>
              Tennessee Coalition for Better Aging
            </h1>
            <p className='text-base sm:text-lg text-white/90 leading-relaxed max-w-[80%]'>
              The Tennessee Coalition for Better Aging (TCBA) exists to promote the general welfare
              of older Tennesseans and their families; through partnerships that mobilize resources
              to educate and advocate for important policies and programs.
            </p>
            <button className='bg-[#cc4444] text-white px-6 py-3 rounded-[18px] text-sm sm:text-base font-semibold shadow-lg hover:bg-[#b53a3a] transition'>
              Stay Connected
            </button>
          </div>
        </div>
      </section>

      <section className='relative w-screen left-1/2 -translate-x-1/2 -mt-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 gap-0'>
          <div className='bg-white border border-transparent shadow-lg px-8 sm:px-12 py-12 space-y-6 min-h-[220px] flex flex-col justify-center'>
            <div className='space-y-3'>
              <h2 className='text-3xl font-semibold text-slate-900 mb-6'>
                Working Towards a Better Tomorrow
              </h2>
              <p className='text-base text-slate-600 leading-relaxed max-w-[80%]'>
                Given that older adults are the fastest growing segment of Tennessee's population
                and the most significant increase will be among those 85 and older, and given that
                family caregivers provide over 80% of long-term care, we are committed to advocating
                for and with older adults and their families.
              </p>
            </div>
            <p className='text-base text-slate-600 leading-relaxed max-w-[80%]'>
              The Coalition for Better Aging takes collective action to ensure that older adults can
              age with dignity and family caregivers have the support they need. The COVID-19
              pandemic highlighted the shortcomings of our current systems and the need to
              prioritize the health and well-being of older Tennesseans and their families.
            </p>
          </div>
          {[1, 2, 3].map(item => (
            <div
              key={item}
              className='min-h-[220px] bg-slate-200 border border-transparent shadow-inner'
            />
          ))}
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 sm:px-6 space-y-12 text-center'>
        <div className='space-y-5'>
          <h2 className='text-3xl font-semibold text-slate-900'>How We Work</h2>
          <p className='text-lg text-slate-600 italic max-w-3xl mx-auto leading-relaxed'>
            "We have to do the work of imagining what could be possible, and then do our part to
            make it real" - Tallu Quinn, Former Director Nashville Food Project
          </p>
        </div>
        <div className='grid gap-12 md:grid-cols-3 justify-items-center'>
          {howWeWorkItems.map(item => (
            <div
              key={item.title}
              className='flex flex-col items-center text-center space-y-4 max-w-sm'
            >
              <div className='w-14 h-14 rounded-md bg-slate-200' />
              <div className='space-y-3 px-2'>
                <h3 className='text-xl font-semibold text-slate-900'>{item.title}</h3>
                <p className='text-sm text-slate-600 leading-relaxed'>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 sm:px-6 space-y-12 text-center'>
        <div className='space-y-3'>
          <h2 className='text-3xl font-semibold text-slate-900'>Why We Work Together</h2>
          <p className='text-base text-slate-600'>Our voices are stronger together.</p>
        </div>
        <div className='grid gap-12 md:grid-cols-3 justify-items-center'>
          {whyWeWorkItems.map(item => (
            <div
              key={item.title}
              className='flex flex-col items-center text-center space-y-4 max-w-sm'
            >
              <div className='w-14 h-14 rounded-md bg-slate-200' />
              <div className='space-y-3 px-2'>
                <h3 className='text-xl font-semibold text-slate-900'>{item.title}</h3>
                <p className='text-sm text-slate-600 leading-relaxed'>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


export default HomePage;
