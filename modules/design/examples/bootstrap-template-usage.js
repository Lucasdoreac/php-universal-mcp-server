/**
 * Exemplo de uso dos templates Bootstrap
 * 
 * Este arquivo demonstra como utilizar os templates Bootstrap
 * em uma aplicação Node.js usando o PHP Universal MCP Server.
 */

const { DesignSystem, BootstrapTemplateRenderer } = require('../index');
const path = require('path');
const fs = require('fs');

// Inicializar o Design System com suporte a Bootstrap
const designSystem = new DesignSystem({
  enableBootstrap: true,
  bootstrapVersion: '5.3.0'
});

// Criar um renderizador de templates Bootstrap
const templateRenderer = designSystem.createBootstrapRenderer({
  templatesDir: path.join(__dirname, '../templates')
});

// Diretório para salvar os exemplos renderizados
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

/**
 * Exemplo 1: Renderizar um template de e-commerce
 */
async function renderEcommerceExample() {
  try {
    // Dados de amostra para uma loja virtual
    const storeData = {
      siteInfo: {
        title: 'MyStore - Best Online Shop',
        description: 'Shop the latest products with best prices',
        logo: '/assets/logo.png'
      },
      featured: [
        {
          id: 'product1',
          title: 'Premium Headphones',
          price: 199.99,
          salePrice: 149.99,
          image: 'https://via.placeholder.com/300x300/007bff/ffffff',
          rating: 4.5,
          reviews: 128
        },
        {
          id: 'product2',
          title: 'Wireless Mouse',
          price: 49.99,
          image: 'https://via.placeholder.com/300x300/28a745/ffffff',
          rating: 4.2,
          reviews: 75
        },
        {
          id: 'product3',
          title: 'Mechanical Keyboard',
          price: 129.99,
          salePrice: 99.99,
          image: 'https://via.placeholder.com/300x300/dc3545/ffffff',
          rating: 4.8,
          reviews: 212
        },
        {
          id: 'product4',
          title: 'Gaming Monitor',
          price: 349.99,
          image: 'https://via.placeholder.com/300x300/ffc107/ffffff',
          rating: 4.6,
          reviews: 94
        }
      ],
      categories: [
        { id: 'cat1', name: 'Electronics', image: 'https://via.placeholder.com/200x200/007bff/ffffff' },
        { id: 'cat2', name: 'Computers', image: 'https://via.placeholder.com/200x200/28a745/ffffff' },
        { id: 'cat3', name: 'Audio', image: 'https://via.placeholder.com/200x200/dc3545/ffffff' },
        { id: 'cat4', name: 'Accessories', image: 'https://via.placeholder.com/200x200/ffc107/ffffff' }
      ],
      banners: [
        {
          image: 'https://via.placeholder.com/1200x400/007bff/ffffff',
          title: 'Summer Sale',
          caption: 'Up to 50% off on selected items',
          buttonText: 'Shop Now',
          buttonUrl: '/sale'
        },
        {
          image: 'https://via.placeholder.com/1200x400/28a745/ffffff',
          title: 'New Arrivals',
          caption: 'Check out our latest products',
          buttonText: 'Discover',
          buttonUrl: '/new'
        }
      ],
      newArrivals: [
        {
          id: 'product5',
          title: 'Wireless Earbuds',
          price: 89.99,
          image: 'https://via.placeholder.com/300x300/6610f2/ffffff',
          rating: 4.3,
          reviews: 42
        },
        {
          id: 'product6',
          title: 'Smart Watch',
          price: 199.99,
          image: 'https://via.placeholder.com/300x300/fd7e14/ffffff',
          rating: 4.1,
          reviews: 37
        }
      ]
    };
    
    // Opções de personalização do template
    const templateOptions = {
      colorScheme: 'primary',
      layout: 'standard',
      sections: {
        featured: true,
        categories: true,
        banners: true,
        newArrivals: true,
        newsletter: true
      },
      productsPerRow: 4,
      showRatings: true,
      showDiscounts: true
    };
    
    // Renderizar o template
    const html = await templateRenderer.render('bs-ecommerce', templateOptions, storeData);
    
    // Salvar o HTML em um arquivo para visualização
    fs.writeFileSync(path.join(outputDir, 'ecommerce-example.html'), html);
    
    console.log('E-commerce template rendered and saved to output/ecommerce-example.html');
  } catch (error) {
    console.error('Error rendering e-commerce template:', error);
  }
}

/**
 * Exemplo 2: Renderizar um template de landing page
 */
async function renderLandingPageExample() {
  try {
    // Dados de amostra para uma landing page
    const landingData = {
      siteInfo: {
        title: 'SaaS App - Boost Your Productivity',
        description: 'The all-in-one productivity tool for teams',
        logo: '/assets/logo.png'
      },
      hero: {
        heading: 'Simplify Your Workflow',
        subheading: 'The all-in-one platform that helps your team collaborate, manage tasks, and deliver projects on time.',
        backgroundImage: 'https://via.placeholder.com/1920x1080/007bff/ffffff',
        primaryButtonText: 'Get Started',
        primaryButtonUrl: '/signup',
        secondaryButtonText: 'Learn More',
        secondaryButtonUrl: '#features'
      },
      features: [
        {
          title: 'Task Management',
          description: 'Create, assign, and track tasks with ease. Keep your projects organized and on schedule.',
          icon: 'check-circle'
        },
        {
          title: 'Team Collaboration',
          description: 'Work together seamlessly with real-time updates, comments, and file sharing.',
          icon: 'people'
        },
        {
          title: 'Time Tracking',
          description: 'Track time spent on tasks and projects. Generate detailed reports for billing and analysis.',
          icon: 'clock'
        },
        {
          title: 'Analytics Dashboard',
          description: 'Get insights into your team\'s performance with customizable reports and visualizations.',
          icon: 'graph-up'
        }
      ],
      about: {
        title: 'Why Choose Us',
        content: '<p>Our platform is designed to help teams of all sizes streamline their workflow and boost productivity.</p><p>With our intuitive interface and powerful features, you can focus on what matters most: delivering great results.</p>',
        image: 'https://via.placeholder.com/600x400/28a745/ffffff',
        buttonText: 'Read Our Story',
        buttonUrl: '/about'
      },
      testimonials: [
        {
          author: 'John Smith',
          role: 'Project Manager',
          company: 'Tech Solutions Inc.',
          avatar: 'https://via.placeholder.com/100x100/007bff/ffffff',
          content: 'This platform has transformed how our team works. We\'ve increased productivity by 35% in just two months.'
        },
        {
          author: 'Sarah Johnson',
          role: 'Marketing Director',
          company: 'Creative Agency',
          avatar: 'https://via.placeholder.com/100x100/28a745/ffffff',
          content: 'The collaboration features are fantastic. We can now work together seamlessly even with remote team members.'
        },
        {
          author: 'Michael Brown',
          role: 'CEO',
          company: 'Startup Hub',
          avatar: 'https://via.placeholder.com/100x100/dc3545/ffffff',
          content: 'Implementing this solution has been one of the best decisions we\'ve made for our growing team.'
        }
      ],
      pricing: [
        {
          name: 'Starter',
          price: '$29',
          period: 'per month',
          description: 'Perfect for small teams getting started',
          features: [
            'Up to 5 team members',
            'Basic task management',
            'File sharing (5GB)',
            'Email support'
          ],
          buttonText: 'Start Free Trial',
          buttonUrl: '/signup?plan=starter'
        },
        {
          name: 'Professional',
          price: '$79',
          period: 'per month',
          description: 'Ideal for growing teams with advanced needs',
          features: [
            'Up to 20 team members',
            'Advanced task management',
            'File sharing (50GB)',
            'Time tracking',
            'Priority support'
          ],
          buttonText: 'Start Free Trial',
          buttonUrl: '/signup?plan=professional',
          highlighted: true
        },
        {
          name: 'Enterprise',
          price: '$199',
          period: 'per month',
          description: 'For large organizations with complex requirements',
          features: [
            'Unlimited team members',
            'Advanced task management',
            'File sharing (Unlimited)',
            'Time tracking',
            'Custom reporting',
            'Dedicated support'
          ],
          buttonText: 'Contact Sales',
          buttonUrl: '/contact-sales'
        }
      ],
      cta: {
        title: 'Ready to Boost Your Team\'s Productivity?',
        subtitle: 'Join thousands of teams already using our platform',
        buttonText: 'Start Your Free Trial',
        buttonUrl: '/signup',
        backgroundImage: 'https://via.placeholder.com/1920x1080/007bff/ffffff'
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'Have questions? We\'re here to help.',
        email: 'info@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St, Suite 100, San Francisco, CA 94107'
      },
      footer: {
        copyright: '© 2025 SaaS App. All rights reserved.',
        socialLinks: {
          facebook: 'https://facebook.com',
          twitter: 'https://twitter.com',
          linkedin: 'https://linkedin.com'
        }
      }
    };
    
    // Opções de personalização do template
    const templateOptions = {
      colorScheme: 'primary',
      layout: 'standard',
      heroStyle: 'image-background',
      ctaPosition: 'bottom',
      sections: {
        hero: true,
        features: true,
        about: true,
        testimonials: true,
        pricing: true,
        cta: true,
        contact: true
      },
      animationsEnabled: true,
      navbarFixed: true,
      useIcons: true
    };
    
    // Renderizar o template
    const html = await templateRenderer.render('bs-landing', templateOptions, landingData);
    
    // Salvar o HTML em um arquivo para visualização
    fs.writeFileSync(path.join(outputDir, 'landing-example.html'), html);
    
    console.log('Landing page template rendered and saved to output/landing-example.html');
  } catch (error) {
    console.error('Error rendering landing page template:', error);
  }
}

/**
 * Exemplo 3: Renderizar um template de portfolio
 */
async function renderPortfolioExample() {
  try {
    // Dados de amostra para um portfolio
    const portfolioData = {
      profile: {
        name: 'Alex Morgan',
        title: 'Web Designer & Developer',
        avatar: 'https://via.placeholder.com/200x200/007bff/ffffff',
        bio: 'I am a passionate web designer and developer with over 5 years of experience creating beautiful and functional websites and applications.',
        cvUrl: '/assets/alex-morgan-cv.pdf'
      },
      hero: {
        heading: 'Alex Morgan',
        subheading: 'Bringing your digital ideas to life with creativity and code',
        backgroundImage: 'https://via.placeholder.com/1920x1080/212529/ffffff',
        buttonText: 'View My Work',
        buttonUrl: '#projects'
      },
      about: {
        title: 'About Me',
        content: '<p>I specialize in creating responsive websites and web applications that provide exceptional user experiences. With a background in both design and development, I bridge the gap between aesthetics and functionality.</p><p>My goal is to help businesses and individuals establish a strong online presence through custom web solutions that not only look great but also perform well.</p>',
        image: 'https://via.placeholder.com/600x800/28a745/ffffff',
        counters: [
          { label: 'Projects Completed', value: 87, icon: 'briefcase' },
          { label: 'Clients', value: 42, icon: 'people' },
          { label: 'Years Experience', value: 5, icon: 'calendar' }
        ]
      },
      skills: [
        { name: 'HTML/CSS', level: 95, icon: 'code-slash' },
        { name: 'JavaScript', level: 90, icon: 'braces' },
        { name: 'React', level: 85, icon: 'code' },
        { name: 'Node.js', level: 80, icon: 'server' },
        { name: 'UI/UX Design', level: 88, icon: 'palette' },
        { name: 'Responsive Design', level: 92, icon: 'phone' }
      ],
      projects: [
        {
          title: 'E-commerce Website',
          description: 'A full-featured online store built with React and Node.js, featuring product catalog, shopping cart, and secure checkout.',
          thumbnail: 'https://via.placeholder.com/600x400/007bff/ffffff',
          images: [
            'https://via.placeholder.com/1200x800/007bff/ffffff',
            'https://via.placeholder.com/1200x800/0056b3/ffffff',
            'https://via.placeholder.com/1200x800/004085/ffffff'
          ],
          category: 'web',
          tags: ['React', 'Node.js', 'E-commerce'],
          client: 'FashionRetail Inc.',
          date: 'January 2025',
          url: 'https://example.com/project1'
        },
        {
          title: 'Portfolio Website',
          description: 'A clean and modern portfolio site for a photographer with image gallery and contact form.',
          thumbnail: 'https://via.placeholder.com/600x400/28a745/ffffff',
          images: [
            'https://via.placeholder.com/1200x800/28a745/ffffff',
            'https://via.placeholder.com/1200x800/218838/ffffff',
            'https://via.placeholder.com/1200x800/1e7e34/ffffff'
          ],
          category: 'design',
          tags: ['HTML/CSS', 'JavaScript', 'Portfolio'],
          client: 'Jane Smith Photography',
          date: 'December 2024',
          url: 'https://example.com/project2'
        },
        {
          title: 'Mobile App UI Design',
          description: 'User interface design for a fitness tracking mobile application with workout plans and progress tracking.',
          thumbnail: 'https://via.placeholder.com/600x400/dc3545/ffffff',
          images: [
            'https://via.placeholder.com/1200x800/dc3545/ffffff',
            'https://via.placeholder.com/1200x800/c82333/ffffff',
            'https://via.placeholder.com/1200x800/bd2130/ffffff'
          ],
          category: 'ui',
          tags: ['UI/UX', 'Mobile', 'Fitness'],
          client: 'FitLife App',
          date: 'November 2024',
          url: 'https://example.com/project3'
        },
        {
          title: 'Corporate Website',
          description: 'A professional website for a law firm with service information, team profiles, and case studies.',
          thumbnail: 'https://via.placeholder.com/600x400/ffc107/ffffff',
          images: [
            'https://via.placeholder.com/1200x800/ffc107/ffffff',
            'https://via.placeholder.com/1200x800/e0a800/ffffff',
            'https://via.placeholder.com/1200x800/d39e00/ffffff'
          ],
          category: 'web',
          tags: ['WordPress', 'Corporate', 'Responsive'],
          client: 'Johnson & Partners Law',
          date: 'October 2024',
          url: 'https://example.com/project4'
        }
      ],
      testimonials: [
        {
          author: 'Emma Wilson',
          role: 'CEO',
          company: 'FashionRetail Inc.',
          avatar: 'https://via.placeholder.com/100x100/007bff/ffffff',
          content: 'Alex delivered an exceptional e-commerce website that exceeded our expectations. The design is beautiful and the functionality is flawless.'
        },
        {
          author: 'David Brown',
          role: 'Marketing Director',
          company: 'Johnson & Partners Law',
          avatar: 'https://via.placeholder.com/100x100/28a745/ffffff',
          content: 'Working with Alex was a pleasure. He understood our requirements perfectly and created a website that perfectly represents our brand.'
        }
      ],
      contact: {
        title: 'Get In Touch',
        subtitle: 'Interested in working together? Let\'s discuss your project.',
        email: 'alex@example.com',
        phone: '+1 (555) 123-4567',
        address: 'San Francisco, CA',
        formEndpoint: '/api/contact'
      },
      socialLinks: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
        dribbble: 'https://dribbble.com'
      },
      footer: {
        copyright: '© 2025 Alex Morgan. All rights reserved.'
      }
    };
    
    // Opções de personalização do template
    const templateOptions = {
      colorScheme: 'creative',
      layout: 'grid',
      heroStyle: 'centered',
      projectDetailStyle: 'modal',
      sections: {
        hero: true,
        about: true,
        skills: true,
        projects: true,
        testimonials: true,
        contact: true
      },
      filterProjects: true,
      projectsPerRow: 2,
      animationsEnabled: true,
      darkMode: false,
      showSocialLinks: true
    };
    
    // Renderizar o template
    const html = await templateRenderer.render('bs-portfolio', templateOptions, portfolioData);
    
    // Salvar o HTML em um arquivo para visualização
    fs.writeFileSync(path.join(outputDir, 'portfolio-example.html'), html);
    
    console.log('Portfolio template rendered and saved to output/portfolio-example.html');
  } catch (error) {
    console.error('Error rendering portfolio template:', error);
  }
}

/**
 * Exemplo 4: Renderizar um template de blog
 */
async function renderBlogExample() {
  try {
    // Dados de amostra para um blog
    const blogData = {
      siteInfo: {
        title: 'Tech Insights Blog',
        description: 'Latest insights and news about technology and development',
        logo: '/assets/logo.png'
      },
      featuredPosts: [
        {
          id: 'post1',
          title: 'The Future of Web Development in 2025',
          excerpt: 'Explore the emerging trends and technologies that will shape web development in the coming year.',
          content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
          image: 'https://via.placeholder.com/800x450/007bff/ffffff',
          author: {
            name: 'John Doe',
            avatar: 'https://via.placeholder.com/50x50/007bff/ffffff',
            bio: 'Senior Web Developer and tech enthusiast'
          },
          date: '2025-03-15',
          category: 'Web Development',
          tags: ['JavaScript', 'React', 'Trends'],
          comments: 12,
          url: '/post/future-web-development-2025'
        },
        {
          id: 'post2',
          title: 'Best Practices for Responsive Design',
          excerpt: 'Learn how to create websites that look great on any device with these responsive design techniques.',
          content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
          image: 'https://via.placeholder.com/800x450/28a745/ffffff',
          author: {
            name: 'Sarah Johnson',
            avatar: 'https://via.placeholder.com/50x50/28a745/ffffff',
            bio: 'UX Designer and front-end specialist'
          },
          date: '2025-03-10',
          category: 'Design',
          tags: ['CSS', 'Responsive', 'Mobile'],
          comments: 8,
          url: '/post/best-practices-responsive-design'
        }
      ],
      recentPosts: [
        {
          id: 'post3',
          title: 'Introduction to TypeScript for JavaScript Developers',
          excerpt: 'A beginner-friendly guide to TypeScript and its benefits for JavaScript developers.',
          image: 'https://via.placeholder.com/400x225/dc3545/ffffff',
          author: {
            name: 'Michael Brown',
            avatar: 'https://via.placeholder.com/50x50/dc3545/ffffff'
          },
          date: '2025-03-05',
          category: 'JavaScript',
          comments: 5,
          url: '/post/introduction-typescript'
        },
        {
          id: 'post4',
          title: 'Building RESTful APIs with Node.js and Express',
          excerpt: 'Learn how to create robust and scalable RESTful APIs using Node.js and Express.',
          image: 'https://via.placeholder.com/400x225/ffc107/ffffff',
          author: {
            name: 'Emily Davis',
            avatar: 'https://via.placeholder.com/50x50/ffc107/ffffff'
          },
          date: '2025-03-01',
          category: 'Backend',
          comments: 3,
          url: '/post/building-restful-apis'
        },
        {
          id: 'post5',
          title: 'Getting Started with Docker for Web Development',
          excerpt: 'A practical guide to using Docker containers for your web development workflow.',
          image: 'https://via.placeholder.com/400x225/6610f2/ffffff',
          author: {
            name: 'David Wilson',
            avatar: 'https://via.placeholder.com/50x50/6610f2/ffffff'
          },
          date: '2025-02-25',
          category: 'DevOps',
          comments: 7,
          url: '/post/getting-started-docker'
        }
      ],
      categories: [
        { name: 'Web Development', count: 12, url: '/category/web-development' },
        { name: 'JavaScript', count: 8, url: '/category/javascript' },
        { name: 'Design', count: 6, url: '/category/design' },
        { name: 'Backend', count: 5, url: '/category/backend' },
        { name: 'DevOps', count: 3, url: '/category/devops' }
      ],
      popularTags: [
        { name: 'JavaScript', count: 15, url: '/tag/javascript' },
        { name: 'React', count: 10, url: '/tag/react' },
        { name: 'CSS', count: 8, url: '/tag/css' },
        { name: 'Node.js', count: 7, url: '/tag/nodejs' },
        { name: 'TypeScript', count: 5, url: '/tag/typescript' },
        { name: 'Docker', count: 4, url: '/tag/docker' },
        { name: 'API', count: 3, url: '/tag/api' }
      ],
      popularPosts: [
        {
          title: '10 JavaScript Libraries to Try in 2025',
          comments: 24,
          url: '/post/javascript-libraries-2025'
        },
        {
          title: 'CSS Grid vs Flexbox: Which Should You Use?',
          comments: 18,
          url: '/post/css-grid-vs-flexbox'
        },
        {
          title: 'A Complete Guide to React Hooks',
          comments: 15,
          url: '/post/complete-guide-react-hooks'
        }
      ],
      newsletter: {
        title: 'Subscribe to Our Newsletter',
        description: 'Get the latest articles and resources sent straight to your inbox.',
        buttonText: 'Subscribe'
      },
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com'
      },
      footer: {
        copyright: '© 2025 Tech Insights Blog. All rights reserved.',
        links: [
          { text: 'Home', url: '/' },
          { text: 'About', url: '/about' },
          { text: 'Contact', url: '/contact' },
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' }
        ]
      }
    };
    
    // Opções de personalização do template
    const templateOptions = {
      colorScheme: 'primary',
      layout: 'standard',
      postLayout: 'card',
      showFeaturedImage: true,
      showAuthor: true,
      showDate: true,
      sidebar: 'right',
      sections: {
        featured: true,
        recent: true,
        categories: true,
        tags: true,
        popular: true,
        newsletter: true
      }
    };
    
    // Renderizar o template
    const html = await templateRenderer.render('bs-blog', templateOptions, blogData);
    
    // Salvar o HTML em um arquivo para visualização
    fs.writeFileSync(path.join(outputDir, 'blog-example.html'), html);
    
    console.log('Blog template rendered and saved to output/blog-example.html');
  } catch (error) {
    console.error('Error rendering blog template:', error);
  }
}

/**
 * Função principal para executar os exemplos
 */
async function main() {
  console.log('===== Bootstrap Template Examples =====');
  
  console.log('\n1. E-commerce Template Example:');
  await renderEcommerceExample();
  
  console.log('\n2. Landing Page Template Example:');
  await renderLandingPageExample();
  
  console.log('\n3. Portfolio Template Example:');
  await renderPortfolioExample();
  
  console.log('\n4. Blog Template Example:');
  await renderBlogExample();
  
  console.log('\nAll examples completed!');
}

// Executar os exemplos
main().catch(error => {
  console.error('Error in examples:', error);
});