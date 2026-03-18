import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting page content seed...');

  const pageContent = [
    {
      page: 'home',
      section: 'hero',
      contentKey: 'title',
      contentValue: 'Tennessee Coalition for Better Aging',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'hero',
      contentKey: 'subtitle',
      contentValue:
        'Empowering organizations across Tennessee to improve the lives of older adults through collaboration, advocacy, and innovation.',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'hero',
      contentKey: 'ctaText',
      contentValue: 'Join Our Coalition',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'mission',
      contentKey: 'title',
      contentValue: 'Our Mission',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'mission',
      contentKey: 'description',
      contentValue:
        'The Tennessee Coalition for Better Aging brings together organizations dedicated to enhancing the quality of life for older adults across Tennessee. We work to promote healthy aging, support family caregivers, and advocate for policies that benefit our senior population.',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature1Title',
      contentValue: 'Statewide Network',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature1Description',
      contentValue:
        'Connect with member organizations across all three Tennessee regions - East, Middle, and West.',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature2Title',
      contentValue: 'Resources & Support',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature2Description',
      contentValue:
        'Access educational materials, best practices, and professional development opportunities.',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature3Title',
      contentValue: 'Advocacy & Policy',
      contentType: 'text',
    },
    {
      page: 'home',
      section: 'features',
      contentKey: 'feature3Description',
      contentValue:
        'Join our collective voice in advocating for policies that support healthy aging and senior services.',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'overview',
      contentKey: 'title',
      contentValue: 'About Us',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'overview',
      contentKey: 'description',
      contentValue:
        "The Tennessee Coalition for Better Aging (TCBA) was founded to address the growing needs of Tennessee's aging population. We bring together Area Agencies on Aging, healthcare providers, social service organizations, advocacy groups, and community partners to create a unified approach to serving older adults.",
      contentType: 'html',
    },
    {
      page: 'about',
      section: 'values',
      contentKey: 'title',
      contentValue: 'Our Values',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'values',
      contentKey: 'value1',
      contentValue: 'Collaboration: We believe in the power of working together',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'values',
      contentKey: 'value2',
      contentValue: 'Dignity: Every older adult deserves respect and independence',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'values',
      contentKey: 'value3',
      contentValue: 'Innovation: We embrace new approaches to aging services',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'values',
      contentKey: 'value4',
      contentValue: 'Equity: All Tennesseans should have access to quality aging services',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'impact',
      contentKey: 'title',
      contentValue: 'Our Impact',
      contentType: 'text',
    },
    {
      page: 'about',
      section: 'impact',
      contentKey: 'description',
      contentValue:
        'Through our coalition, we serve hundreds of organizations across Tennessee, reaching thousands of older adults and their families. Our members provide critical services including nutrition programs, transportation, caregiver support, health education, and advocacy.',
      contentType: 'text',
    },
    {
      page: 'contact',
      section: 'info',
      contentKey: 'title',
      contentValue: 'Contact Us',
      contentType: 'text',
    },
    {
      page: 'contact',
      section: 'info',
      contentKey: 'description',
      contentValue:
        "Have questions about membership, programs, or how we can support your organization? We'd love to hear from you.",
      contentType: 'text',
    },
    {
      page: 'contact',
      section: 'info',
      contentKey: 'email',
      contentValue: 'info@tcba.org',
      contentType: 'text',
    },
    {
      page: 'contact',
      section: 'info',
      contentKey: 'phone',
      contentValue: '(615) 555-0100',
      contentType: 'text',
    },
    {
      page: 'contact',
      section: 'info',
      contentKey: 'address',
      contentValue: '123 Aging Services Blvd, Nashville, TN 37203',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'hero',
      contentKey: 'title',
      contentValue: 'Join the Tennessee Coalition for Better Aging',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'hero',
      contentKey: 'subtitle',
      contentValue:
        "Become part of Tennessee's leading network of organizations dedicated to serving older adults.",
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'benefits',
      contentKey: 'title',
      contentValue: 'Membership Benefits',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'benefits',
      contentKey: 'benefit1',
      contentValue: 'Access to statewide network and resources',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'benefits',
      contentKey: 'benefit2',
      contentValue: 'Professional development opportunities',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'benefits',
      contentKey: 'benefit3',
      contentValue: 'Policy advocacy and legislative updates',
      contentType: 'text',
    },
    {
      page: 'register',
      section: 'benefits',
      contentKey: 'benefit4',
      contentValue: 'Collaboration with other aging service providers',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'hero',
      contentKey: 'title',
      contentValue: 'Stay Connected',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'hero',
      contentKey: 'subtitle',
      contentValue:
        'Subscribe to receive updates about programs, events, and resources for older adults and caregivers in Tennessee.',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'benefits',
      contentKey: 'title',
      contentValue: "What You'll Receive",
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'benefits',
      contentKey: 'benefit1',
      contentValue: 'Monthly newsletter with aging resources',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'benefits',
      contentKey: 'benefit2',
      contentValue: 'Announcements about events and workshops',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'benefits',
      contentKey: 'benefit3',
      contentValue: 'New blog posts and educational content',
      contentType: 'text',
    },
    {
      page: 'email-signup',
      section: 'benefits',
      contentKey: 'benefit4',
      contentValue: 'Important alerts and updates',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'header',
      contentKey: 'title',
      contentValue: 'Advocacy',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'header',
      contentKey: 'description',
      contentValue:
        'We champion policies that strengthen aging services, support family caregivers, and protect the rights and dignity of older Tennesseans.',
      contentType: 'richtext',
    },
    {
      page: 'advocacy',
      section: 'header',
      contentKey: 'image',
      contentValue: '',
      contentType: 'image',
    },
    {
      page: 'advocacy',
      section: 'focus',
      contentKey: 'title',
      contentValue: 'Our Advocacy Focus',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'focus',
      contentKey: 'description',
      contentValue:
        'TCBA works with coalition partners and state leaders to advance policy priorities that expand access to home and community-based services, invest in the direct care workforce, and improve systems for older adults and people with disabilities.',
      contentType: 'richtext',
    },
    {
      page: 'advocacy',
      section: 'focus',
      contentKey: 'image',
      contentValue: '',
      contentType: 'image',
    },
    {
      page: 'advocacy',
      section: 'cards',
      contentKey: 'policy_title',
      contentValue: 'Policy Development',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'cards',
      contentKey: 'coalition_title',
      contentValue: 'Coalition Mobilization',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'cards',
      contentKey: 'public_title',
      contentValue: 'Public Awareness',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'cta',
      contentKey: 'title',
      contentValue: 'Join Our Advocacy Efforts',
      contentType: 'text',
    },
    {
      page: 'advocacy',
      section: 'cta',
      contentKey: 'description',
      contentValue:
        'Partner with TCBA to help shape policies and programs that improve the lives of older Tennesseans and their families.',
      contentType: 'richtext',
    },
    {
      page: 'advocacy',
      section: 'cta',
      contentKey: 'button_text',
      contentValue: 'Get Involved',
      contentType: 'text',
    },
    {
      page: 'announcements',
      section: 'hero',
      contentKey: 'title',
      contentValue: 'Announcements',
      contentType: 'text',
    },
    {
      page: 'announcements',
      section: 'hero',
      contentKey: 'subtitle',
      contentValue:
        'Stay informed about the latest news, programs, and opportunities from the Tennessee Coalition for Better Aging.',
      contentType: 'text',
    },
    {
      page: 'blogs',
      section: 'hero',
      contentKey: 'title',
      contentValue: 'Resources & Insights',
      contentType: 'text',
    },
    {
      page: 'blogs',
      section: 'hero',
      contentKey: 'subtitle',
      contentValue:
        'Educational articles and resources to support healthy aging, caregiving, and senior services in Tennessee.',
      contentType: 'text',
    },
  ];

  console.log('Creating page content...');
  for (const content of pageContent) {
    await prisma.pageContent.upsert({
      where: {
        page_section_contentKey: {
          page: content.page,
          section: content.section,
          contentKey: content.contentKey,
        },
      },
      update: {
        contentValue: content.contentValue,
        contentType: content.contentType,
      },
      create: content,
    });
  }

  console.log('Page content seed completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during page content seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
