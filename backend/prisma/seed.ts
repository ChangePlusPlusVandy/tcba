import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Starting seed...');

  const organizations = [
    {
      name: 'AARP Tennessee',
      email: 'tnaarp@aarp.org',
      description:
        'AARP is a nonprofit, nonpartisan organization that empowers people to choose how they live as they age.',
      website: 'https://states.aarp.org/tennessee/',
      address: '150 4th Ave N, Suite 1100',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37219',
      latitude: 36.1643,
      longitude: -86.7786,
      region: 'MIDDLE' as const,
      organizationType: 'Advocacy',
      primaryContactName: 'AARP Tennessee',
      primaryContactEmail: 'tnaarp@aarp.org',
      primaryContactPhone: '(866) 295-7275',
    },
    {
      name: 'AgeWell Middle Tennessee',
      email: 'info@agewelltn.org',
      description:
        'AgeWell Middle Tennessee promotes the independence and well-being of older adults through programs and advocacy.',
      website: 'https://agewelltn.org/',
      address: '1514 McCavock St',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37216',
      latitude: 36.1751,
      longitude: -86.7498,
      region: 'MIDDLE' as const,
      organizationType: 'Senior Services',
      primaryContactName: 'Grace Sutherland Smith',
      primaryContactEmail: 'info@agewelltn.org',
      primaryContactPhone: '(615) 743-3400',
    },
    {
      name: 'Aging Commission of the Mid-South',
      email: 'info@agingcommission.org',
      description: 'Serving older adults and adults with disabilities in Shelby County.',
      website: 'https://shelbycountytn.gov/3433/Aging-Commission-of-the-Mid-South',
      address: '160 N Main St',
      city: 'Memphis',
      state: 'TN',
      zipCode: '38103',
      latitude: 35.1495,
      longitude: -90.049,
      region: 'WEST' as const,
      organizationType: 'Government Agency',
      primaryContactName: 'Aging Commission Staff',
      primaryContactEmail: 'info@agingcommission.org',
      primaryContactPhone: '(901) 222-4100',
    },
    {
      name: "Alzheimer's Association Tennessee Chapter",
      email: 'tennessee@alz.org',
      description:
        "Leading voluntary health organization in Alzheimer's care, support and research.",
      website: 'https://www.alz.org',
      address: '478 Craighead St, Suite 200',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37204',
      latitude: 36.1149,
      longitude: -86.7903,
      region: 'MIDDLE' as const,
      organizationType: 'Health Services',
      primaryContactName: 'Tennessee Chapter',
      primaryContactEmail: 'tennessee@alz.org',
      primaryContactPhone: '(615) 259-4638',
    },
    {
      name: "Alzheimer's Tennessee",
      email: 'info@alztennessee.org',
      description:
        "Providing support and education to families affected by Alzheimer's and dementia.",
      website: 'https://www.alztennessee.org',
      address: '3700 Park Ave',
      city: 'Memphis',
      state: 'TN',
      zipCode: '38111',
      latitude: 35.1376,
      longitude: -89.9426,
      region: 'WEST' as const,
      organizationType: 'Health Services',
      primaryContactName: "Alzheimer's Tennessee",
      primaryContactEmail: 'info@alztennessee.org',
      primaryContactPhone: '(731) 427-4285',
    },
    {
      name: 'Fifty Forward',
      email: 'info@fiftyforward.org',
      description: 'Enriching lives through health, learning, and service for adults 50 and over.',
      website: 'https://www.fiftyforward.org',
      address: '174 Rains Ave',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203',
      latitude: 36.1509,
      longitude: -86.8016,
      region: 'MIDDLE' as const,
      organizationType: 'Senior Services',
      primaryContactName: 'Fifty Forward',
      primaryContactEmail: 'info@fiftyforward.org',
      primaryContactPhone: '(615) 743-3400',
    },
    {
      name: 'First Tennessee Area Agency on Aging and Disability',
      email: 'info@ftaaad.org',
      description: 'Serving older adults and people with disabilities in upper East Tennessee.',
      website: 'https://www.ftaaad.org/',
      address: '2500 W Oakland Ave',
      city: 'Johnson City',
      state: 'TN',
      zipCode: '37604',
      latitude: 36.3413,
      longitude: -82.3936,
      region: 'EAST' as const,
      organizationType: 'Government Agency',
      primaryContactName: 'First TN AAAD',
      primaryContactEmail: 'info@ftaaad.org',
      primaryContactPhone: '(423) 928-3151',
    },
    {
      name: 'Greater Nashville Regional Council',
      email: 'info@gnrc.org',
      description: 'Regional planning and development organization serving Middle Tennessee.',
      website: 'https://www.gnrc.org',
      address: '220 Athens Way, Suite 200',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37228',
      latitude: 36.1935,
      longitude: -86.7725,
      region: 'MIDDLE' as const,
      organizationType: 'Regional Planning',
      primaryContactName: 'GNRC',
      primaryContactEmail: 'info@gnrc.org',
      primaryContactPhone: '(615) 862-8828',
    },
    {
      name: 'Mental Health America of the Mid-South',
      email: 'info@mhamidsouth.org',
      description: 'Promoting mental health and wellness in the Memphis area.',
      website: 'https://mhamidsouth.org/',
      address: '2400 Poplar Ave, Suite 410',
      city: 'Memphis',
      state: 'TN',
      zipCode: '38112',
      latitude: 35.1385,
      longitude: -89.9745,
      region: 'WEST' as const,
      organizationType: 'Health Services',
      primaryContactName: 'MHA Mid-South',
      primaryContactEmail: 'info@mhamidsouth.org',
      primaryContactPhone: '(901) 729-2900',
    },
    {
      name: 'Mid-Cumberland Human Resource Agency',
      email: 'info@mchra.com',
      description:
        'Providing services to enhance the quality of life for individuals and families.',
      website: 'https://www.mchra.com/',
      address: '1000 North Dixie Ave',
      city: 'Cookeville',
      state: 'TN',
      zipCode: '38501',
      latitude: 36.1732,
      longitude: -85.5088,
      region: 'MIDDLE' as const,
      organizationType: 'Human Services',
      primaryContactName: 'MCHRA',
      primaryContactEmail: 'info@mchra.com',
      primaryContactPhone: '(931) 432-4111',
    },
    {
      name: 'NASW Tennessee Chapter',
      email: 'nasw.tennessee@socialworkers.org',
      description: 'Professional organization for social workers in Tennessee.',
      website: 'https://naswtn.socialworkers.org/',
      address: '1904 Acklen Ave',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37212',
      latitude: 36.1372,
      longitude: -86.8022,
      region: 'MIDDLE' as const,
      organizationType: 'Professional Association',
      primaryContactName: 'NASW TN',
      primaryContactEmail: 'nasw.tennessee@socialworkers.org',
      primaryContactPhone: '(615) 321-5095',
    },
    {
      name: 'Northwest Tennessee Development District',
      email: 'info@nwtdd.org',
      description: 'Serving the aging and disability needs of Northwest Tennessee.',
      website: 'https://www.nwtdd.org',
      address: '124 Weldon Dr',
      city: 'Martin',
      state: 'TN',
      zipCode: '38237',
      latitude: 36.3415,
      longitude: -88.8503,
      region: 'WEST' as const,
      organizationType: 'Regional Planning',
      primaryContactName: 'NWTDD',
      primaryContactEmail: 'info@nwtdd.org',
      primaryContactPhone: '(731) 587-4213',
    },
    {
      name: 'Southeast Tennessee Area Agency on Aging and Disability',
      email: 'info@sctdd.org',
      description: 'Supporting older adults and people with disabilities in Southeast Tennessee.',
      website: 'https://www.sctdd.org/aging-and-disability/',
      address: '216 W 8th St',
      city: 'Chattanooga',
      state: 'TN',
      zipCode: '37402',
      latitude: 35.0456,
      longitude: -85.3097,
      region: 'EAST' as const,
      organizationType: 'Government Agency',
      primaryContactName: 'AAAD Southeast TN',
      primaryContactEmail: 'info@sctdd.org',
      primaryContactPhone: '(423) 266-5781',
    },
    {
      name: 'Southwest Tennessee Development District',
      email: 'info@swtdd.org',
      description: 'Providing aging and disability services in Southwest Tennessee.',
      website: 'https://swtdd.org/aging-disability/',
      address: '27 Conrad Dr',
      city: 'Jackson',
      state: 'TN',
      zipCode: '38305',
      latitude: 35.6595,
      longitude: -88.8139,
      region: 'WEST' as const,
      organizationType: 'Regional Planning',
      primaryContactName: 'SWTDD',
      primaryContactEmail: 'info@swtdd.org',
      primaryContactPhone: '(731) 668-7112',
    },
    {
      name: 'Tennessee Alliance for Legal Services',
      email: 'info@tals.org',
      description: "Coordinating Tennessee's legal aid programs.",
      website: 'https://www.tals.org/',
      address: '211 7th Ave N, Suite 400',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37219',
      latitude: 36.1658,
      longitude: -86.7804,
      region: 'MIDDLE' as const,
      organizationType: 'Legal Services',
      primaryContactName: 'TALS',
      primaryContactEmail: 'info@tals.org',
      primaryContactPhone: '(615) 741-3098',
    },
    {
      name: 'Tennessee Association of Area Agencies on Aging and Disability',
      email: 'info@taads.net',
      description: 'Statewide association representing Area Agencies on Aging and Disability.',
      website: 'https://www.taads.net/',
      address: '710 James Robertson Pkwy, Suite 100',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37243',
      latitude: 36.1677,
      longitude: -86.7773,
      region: 'MIDDLE' as const,
      organizationType: 'Association',
      primaryContactName: 'TAADS',
      primaryContactEmail: 'info@taads.net',
      primaryContactPhone: '(615) 532-6740',
    },
    {
      name: 'Tennessee Caregiver Coalition',
      email: 'info@tncaregiver.org',
      description: 'Supporting family caregivers across Tennessee.',
      website: 'https://tncaregiver.org/',
      address: '500 Interstate Blvd S',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37210',
      latitude: 36.1259,
      longitude: -86.7697,
      region: 'MIDDLE' as const,
      organizationType: 'Advocacy',
      primaryContactName: 'TN Caregiver Coalition',
      primaryContactEmail: 'info@tncaregiver.org',
      primaryContactPhone: '(615) 743-3400',
    },
    {
      name: 'Tennessee Disability Coalition',
      email: 'info@tndisability.org',
      description: 'Advocacy organization for Tennesseans with disabilities.',
      website: 'https://www.tndisability.org',
      address: '955 Woodland St',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37206',
      latitude: 36.1823,
      longitude: -86.7536,
      region: 'MIDDLE' as const,
      organizationType: 'Advocacy',
      primaryContactName: 'Donna DeStefano',
      primaryContactEmail: 'info@tndisability.org',
      primaryContactPhone: '(615) 383-9442',
    },
    {
      name: 'Tennessee Health Care Campaign',
      email: 'info@tnhealthcarecampaign.org',
      description:
        'Working to improve access to affordable, quality health care for all Tennesseans.',
      website: 'https://www.tnhealthcarecampaign.org',
      address: '426 7th Ave S',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203',
      latitude: 36.1527,
      longitude: -86.7823,
      region: 'MIDDLE' as const,
      organizationType: 'Advocacy',
      primaryContactName: 'TNHCC',
      primaryContactEmail: 'info@tnhealthcarecampaign.org',
      primaryContactPhone: '(615) 227-7500',
    },
    {
      name: 'Tennessee Justice Center',
      email: 'info@tnjustice.org',
      description: 'Fighting for the legal rights of vulnerable Tennesseans.',
      website: 'https://www.tnjustice.org',
      address: '211 7th Ave N, Suite 100',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37219',
      latitude: 36.1658,
      longitude: -86.7804,
      region: 'MIDDLE' as const,
      organizationType: 'Legal Services',
      primaryContactName: 'TN Justice Center',
      primaryContactEmail: 'info@tnjustice.org',
      primaryContactPhone: '(615) 255-0331',
    },
    {
      name: 'Upper Cumberland Development District',
      email: 'info@ucdd.org',
      description: 'Regional development district serving the Upper Cumberland region.',
      website: 'https://www.ucdd.org',
      address: '1225 S Willow Ave',
      city: 'Cookeville',
      state: 'TN',
      zipCode: '38506',
      latitude: 36.1392,
      longitude: -85.5016,
      region: 'MIDDLE' as const,
      organizationType: 'Regional Planning',
      primaryContactName: 'UCDD',
      primaryContactEmail: 'info@ucdd.org',
      primaryContactPhone: '(931) 432-4111',
    },
    {
      name: 'University of Tennessee College of Social Work',
      email: 'csw@utk.edu',
      description: 'Educating social work professionals and conducting research on aging.',
      website: 'https://csw.utk.edu/',
      address: '1618 Cumberland Ave',
      city: 'Knoxville',
      state: 'TN',
      zipCode: '37996',
      latitude: 35.9544,
      longitude: -83.9294,
      region: 'EAST' as const,
      organizationType: 'Higher Education',
      primaryContactName: 'UT CSW',
      primaryContactEmail: 'csw@utk.edu',
      primaryContactPhone: '(865) 974-3176',
    },
    {
      name: 'Vanderbilt University Medical Center',
      email: 'aging@vumc.org',
      description: 'Leading academic medical center with expertise in geriatric care and research.',
      website: 'https://www.vumc.org',
      address: '1211 Medical Center Dr',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37232',
      latitude: 36.1436,
      longitude: -86.8027,
      region: 'MIDDLE' as const,
      organizationType: 'Healthcare',
      primaryContactName: 'Dr. James Powers',
      primaryContactEmail: 'aging@vumc.org',
      primaryContactPhone: '(615) 322-5000',
    },
    {
      name: 'Centennial Adultcare Center',
      email: 'info@centennialadultcare.com',
      description: 'Providing adult day care services in the Nashville area.',
      website: 'https://www.centennialadultcare.com',
      address: '2300 21st Ave S',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37212',
      latitude: 36.1313,
      longitude: -86.8004,
      region: 'MIDDLE' as const,
      organizationType: 'Senior Services',
      primaryContactName: 'Centennial Adultcare',
      primaryContactEmail: 'info@centennialadultcare.com',
      primaryContactPhone: '(615) 327-2622',
    },
    {
      name: 'East Tennessee Human Resource Agency',
      email: 'info@ethra.org',
      description: 'Area Agency on Aging and Disability serving East Tennessee.',
      website: 'https://www.ethra.org/programs/45/area-agency-on-aging-and-disability/',
      address: '9111 Cross Park Dr, Suite D200',
      city: 'Knoxville',
      state: 'TN',
      zipCode: '37923',
      latitude: 35.9104,
      longitude: -84.0822,
      region: 'EAST' as const,
      organizationType: 'Government Agency',
      primaryContactName: 'ETHRA',
      primaryContactEmail: 'info@ethra.org',
      primaryContactPhone: '(865) 691-2551',
    },
    {
      name: 'ENCORE Ministry Foundation',
      email: 'info@encoreministry.org',
      description: 'Supporting older adults through ministry and community programs.',
      website: 'https://www.encoreministry.org',
      address: '1033 Demonbreun St',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37203',
      latitude: 36.1534,
      longitude: -86.7858,
      region: 'MIDDLE' as const,
      organizationType: 'Non-Profit',
      primaryContactName: 'ENCORE',
      primaryContactEmail: 'info@encoreministry.org',
      primaryContactPhone: '(615) 327-1700',
    },
    {
      name: 'Interfaith Dental Clinic',
      email: 'info@interfaithdental.com',
      description: 'Providing dental care for those in need in the Nashville area.',
      website: 'https://www.interfaithdental.com',
      address: '2001 21st Ave S',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37212',
      latitude: 36.1364,
      longitude: -86.7996,
      region: 'MIDDLE' as const,
      organizationType: 'Healthcare',
      primaryContactName: 'Interfaith Dental',
      primaryContactEmail: 'info@interfaithdental.com',
      primaryContactPhone: '(615) 460-6151',
    },
    {
      name: 'South Central Tennessee Development District',
      email: 'sctndd@sctdd.org',
      description: 'Development district serving South Central Tennessee region.',
      website: 'https://www.sctdd.org/aging-and-disability/',
      address: '815 S Garden St',
      city: 'Columbia',
      state: 'TN',
      zipCode: '38401',
      latitude: 35.6064,
      longitude: -87.0378,
      region: 'MIDDLE' as const,
      organizationType: 'Regional Planning',
      primaryContactName: 'SCTNDD',
      primaryContactEmail: 'sctndd@sctdd.org',
      primaryContactPhone: '(931) 381-2040',
    },
    {
      name: 'Tennessee Federation for the Aging',
      email: 'info@tnfederationfortheaging.org',
      description: 'Advocating for policies and programs that benefit older Tennesseans.',
      website: 'http://www.tnfederationfortheaging.org/',
      address: '710 James Robertson Pkwy',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37243',
      latitude: 36.1677,
      longitude: -86.7773,
      region: 'MIDDLE' as const,
      organizationType: 'Advocacy',
      primaryContactName: 'TN Federation for Aging',
      primaryContactEmail: 'info@tnfederationfortheaging.org',
      primaryContactPhone: '(615) 532-6740',
    },
    {
      name: 'West End Home Foundation',
      email: 'info@westendhomefoundation.org',
      description: 'Supporting seniors in the Nashville community through housing and services.',
      website: 'https://www.westendhomefoundation.org/',
      address: '5101 Harding Pike',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37205',
      latitude: 36.1038,
      longitude: -86.8489,
      region: 'MIDDLE' as const,
      organizationType: 'Senior Services',
      primaryContactName: 'West End Home',
      primaryContactEmail: 'info@westendhomefoundation.org',
      primaryContactPhone: '(615) 356-8002',
    },
  ];

  console.log('Creating organizations...');
  for (const org of organizations) {
    const tempClerkId = `seed_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await prisma.organization.upsert({
      where: { email: org.email },
      update: {},
      create: {
        ...org,
        clerkId: tempClerkId,
        status: 'ACTIVE',
        membershipActive: true,
        membershipDate: new Date(),
        role: 'MEMBER',
      },
    });
  }

  const announcements = [
    {
      title: 'New Partnership with Tennessee Health Department',
      content:
        '<p>We are excited to announce a new partnership with the Tennessee Health Department to improve senior healthcare access across the state. This collaboration will bring new resources and programs to our member organizations.</p>',
      isPublished: true,
      publishedDate: new Date('2024-01-15'),
    },
    {
      title: 'Annual Conference Registration Now Open',
      content:
        '<p>Registration for our 2024 Annual Conference is now open! Join us in Nashville for three days of workshops, networking, and keynote speakers focused on aging services in Tennessee.</p>',
      isPublished: true,
      publishedDate: new Date('2024-02-01'),
    },
    {
      title: 'Grant Opportunities for Member Organizations',
      content:
        '<p>New grant opportunities are available for member organizations focused on transportation services for seniors. Applications are due by March 31st.</p>',
      isPublished: true,
      publishedDate: new Date('2024-02-15'),
    },
    {
      title: 'Legislative Update: Senior Care Bill Passes',
      content:
        '<p>The Tennessee Senior Care Improvement Act has passed the state legislature. This bill will provide additional funding for home-based care services across all three regions.</p>',
      isPublished: true,
      publishedDate: new Date('2024-03-01'),
    },
    {
      title: 'New Resources for Caregiver Support',
      content:
        '<p>We have launched a new resource hub for family caregivers, including educational materials, support group information, and respite care options.</p>',
      isPublished: true,
      publishedDate: new Date('2024-03-15'),
    },
    {
      title: 'Volunteer Appreciation Month',
      content:
        '<p>April is Volunteer Appreciation Month! Join us in celebrating the dedicated volunteers who make our programs possible. Special recognition events will be held throughout the state.</p>',
      isPublished: true,
      publishedDate: new Date('2024-04-01'),
    },
    {
      title: 'Summer Program Schedule Released',
      content:
        '<p>Our summer program schedule is now available. Check out the workshops, seminars, and community events planned for June through August.</p>',
      isPublished: true,
      publishedDate: new Date('2024-05-01'),
    },
    {
      title: 'Technology Training Initiative Launch',
      content:
        '<p>We are launching a new technology training initiative to help seniors stay connected. Free workshops on smartphones, video calls, and online safety will be offered at partner locations.</p>',
      isPublished: true,
      publishedDate: new Date('2024-06-01'),
    },
    {
      title: 'Fall Prevention Awareness Campaign',
      content:
        '<p>September marks the start of our Fall Prevention Awareness Campaign. Resources and training materials are now available for member organizations.</p>',
      isPublished: false,
      publishedDate: null,
    },
    {
      title: 'Holiday Programs and Resources',
      content:
        '<p>Information about holiday programs, including meal delivery services and social events, will be shared soon. Stay tuned for updates from your regional coordinators.</p>',
      isPublished: false,
      publishedDate: null,
    },
  ];

  console.log('Creating announcements...');
  for (const ann of announcements) {
    const slug = generateSlug(ann.title);
    await prisma.announcements.upsert({
      where: { slug },
      update: {},
      create: {
        ...ann,
        slug,
        createdByAdminId: 'admin_seed',
        attachmentUrls: [],
      },
    });
  }

  const blogs = [
    {
      title: 'Understanding Medicare Changes for 2024',
      content:
        '<p>This comprehensive guide explains the key changes to Medicare coverage for 2024, including new benefits, cost adjustments, and enrollment deadlines that seniors need to know.</p><p>Open enrollment runs from October 15 to December 7, giving beneficiaries time to review and adjust their coverage.</p>',
      author: 'Dr. Jane Williams',
      isPublished: true,
      publishedDate: new Date('2024-01-20'),
    },
    {
      title: 'The Importance of Social Connections in Aging',
      content:
        '<p>Research continues to show that maintaining strong social connections is crucial for healthy aging. This article explores ways seniors can stay connected and the health benefits of social engagement.</p>',
      author: 'Sarah Mitchell',
      isPublished: true,
      publishedDate: new Date('2024-02-10'),
    },
    {
      title: 'Navigating Long-Term Care Options in Tennessee',
      content:
        '<p>From in-home care to assisted living facilities, Tennessee offers various long-term care options. Learn about the differences, costs, and how to choose the right option for your family.</p>',
      author: 'Michael Chen',
      isPublished: true,
      publishedDate: new Date('2024-02-25'),
    },
    {
      title: 'Healthy Eating Tips for Seniors',
      content:
        '<p>Nutrition needs change as we age. This article provides practical tips for maintaining a healthy diet, including meal planning ideas and information about nutrition assistance programs.</p>',
      author: 'Nutritionist Lisa Park',
      isPublished: true,
      publishedDate: new Date('2024-03-10'),
    },
    {
      title: 'Exercise Programs Designed for Older Adults',
      content:
        '<p>Staying active is key to healthy aging. Discover exercise programs specifically designed for older adults, from gentle yoga to strength training, available at community centers across Tennessee.</p>',
      author: 'Coach Robert Taylor',
      isPublished: true,
      publishedDate: new Date('2024-03-25'),
    },
    {
      title: 'Financial Planning for Retirement',
      content:
        '<p>Whether you are approaching retirement or already retired, financial planning remains important. This guide covers budgeting, managing healthcare costs, and protecting your assets.</p>',
      author: 'Financial Advisor Amy Ross',
      isPublished: true,
      publishedDate: new Date('2024-04-15'),
    },
    {
      title: 'Technology Made Easy: A Guide for Seniors',
      content:
        '<p>Technology can help seniors stay connected and independent. This beginner-friendly guide covers smartphones, video calling, and online safety basics.</p>',
      author: 'Tech Educator David Kim',
      isPublished: true,
      publishedDate: new Date('2024-05-05'),
    },
    {
      title: 'Caregiver Self-Care: Taking Time for Yourself',
      content:
        '<p>Caregiving can be rewarding but also challenging. Learn about the importance of self-care for caregivers and find resources for respite and support in Tennessee.</p>',
      author: 'Social Worker Maria Garcia',
      isPublished: true,
      publishedDate: new Date('2024-05-20'),
    },
    {
      title: 'Understanding Dementia: Signs, Support, and Resources',
      content:
        '<p>Early detection and proper support can make a significant difference for those living with dementia. This article covers warning signs, support options, and Tennessee resources.</p>',
      author: 'Dr. James Anderson',
      isPublished: false,
      publishedDate: null,
    },
    {
      title: 'Housing Options for Aging in Place',
      content:
        '<p>Many seniors prefer to age in their own homes. Explore home modification options, community programs, and services that support safe and comfortable aging in place.</p>',
      author: 'Housing Specialist Carol White',
      isPublished: false,
      publishedDate: null,
    },
  ];

  console.log('Creating blogs...');
  for (const blog of blogs) {
    const slug = generateSlug(blog.title);
    await prisma.blog.upsert({
      where: { slug },
      update: {},
      create: {
        ...blog,
        slug,
        attachmentUrls: [],
      },
    });
  }

  const surveys = [
    {
      title: 'Q1 2023 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2023-03-31'),
    },
    {
      title: 'Q2 2023 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2023-06-30'),
    },
    {
      title: 'Q3 2023 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2023-09-30'),
    },
    {
      title: 'Q4 2023 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2023-12-31'),
    },
    {
      title: 'Q1 2024 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2024-03-31'),
    },
    {
      title: 'Q2 2024 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: false,
      status: 'CLOSED' as const,
      dueDate: new Date('2024-06-30'),
    },
    {
      title: 'Q3 2024 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: true,
      status: 'ACTIVE' as const,
      dueDate: new Date('2024-09-30'),
    },
    {
      title: 'Q4 2024 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: true,
      isActive: true,
      status: 'ACTIVE' as const,
      dueDate: new Date('2024-12-31'),
    },
    {
      title: 'Q1 2025 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: false,
      isActive: false,
      status: 'DRAFT' as const,
      dueDate: new Date('2025-03-31'),
    },
    {
      title: 'Q2 2025 Member Satisfaction Survey',
      description:
        'Quarterly survey to assess member satisfaction and gather feedback on our services.',
      isPublished: false,
      isActive: false,
      status: 'DRAFT' as const,
      dueDate: new Date('2025-06-30'),
    },
  ];

  const sampleQuestions = [
    {
      id: 'q1',
      type: 'rating',
      text: 'How satisfied are you with our services overall?',
      required: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      id: 'q2',
      type: 'multipleChoice',
      text: 'How often do you use our resources?',
      required: true,
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
    },
    {
      id: 'q3',
      type: 'checkbox',
      text: 'Which services have you used? (Select all that apply)',
      required: false,
      options: [
        'Newsletter',
        'Workshops',
        'Advocacy Support',
        'Networking Events',
        'Resource Library',
      ],
    },
    {
      id: 'q4',
      type: 'text',
      text: 'What improvements would you suggest?',
      required: false,
      textType: 'long',
    },
  ];

  console.log('Creating surveys...');
  for (const survey of surveys) {
    await prisma.survey.create({
      data: {
        ...survey,
        questions: sampleQuestions,
      },
    });
  }

  const alerts = [
    {
      title: 'Severe Weather Advisory for Middle Tennessee',
      content:
        '<p>The National Weather Service has issued a severe weather advisory for Middle Tennessee. Please ensure all programs have emergency protocols in place and check on vulnerable seniors in your community.</p>',
      priority: 'URGENT' as const,
      isPublished: true,
      publishedDate: new Date('2024-04-10'),
    },
    {
      title: 'Medicare Scam Alert',
      content:
        '<p>There have been reports of phone scammers posing as Medicare representatives. Remind seniors never to give out personal information over the phone. Medicare will never call to ask for personal information.</p>',
      priority: 'URGENT' as const,
      isPublished: true,
      publishedDate: new Date('2024-05-15'),
    },
    {
      title: 'Updated COVID-19 Guidelines',
      content:
        '<p>The Tennessee Department of Health has updated COVID-19 guidelines for senior care facilities. Please review the new protocols and ensure your organization is in compliance.</p>',
      priority: 'MEDIUM' as const,
      isPublished: true,
      publishedDate: new Date('2024-06-01'),
    },
    {
      title: 'Summer Heat Safety Reminder',
      content:
        '<p>With temperatures rising, please remind seniors about heat safety. Ensure adequate hydration, air conditioning access, and check on neighbors who may be at risk.</p>',
      priority: 'MEDIUM' as const,
      isPublished: true,
      publishedDate: new Date('2024-06-20'),
    },
    {
      title: 'System Maintenance Scheduled',
      content:
        '<p>Our member portal will undergo scheduled maintenance this weekend. The system will be unavailable Saturday from 2 AM to 6 AM. We apologize for any inconvenience.</p>',
      priority: 'LOW' as const,
      isPublished: true,
      publishedDate: new Date('2024-07-05'),
    },
  ];

  console.log('Creating alerts...');
  for (const alert of alerts) {
    await prisma.alert.create({
      data: {
        ...alert,
        createdByAdminId: 'admin_seed',
        attachmentUrls: [],
        tags: [],
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
