import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bauimperium database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.adminAction.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.review.deleteMany(),
    prisma.materialOrderItem.deleteMany(),
    prisma.materialOrder.deleteMany(),
    prisma.materialProduct.deleteMany(),
    prisma.materialSupplier.deleteMany(),
    prisma.escrowTransaction.deleteMany(),
    prisma.escrowAccount.deleteMany(),
    prisma.milestone.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.offerItem.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.projectApplication.deleteMany(),
    prisma.projectAssignment.deleteMany(),
    prisma.projectMedia.deleteMany(),
    prisma.projectSpecification.deleteMany(),
    prisma.aIAnalysis.deleteMany(),
    prisma.project.deleteMany(),
    prisma.timeslot.deleteMany(),
    prisma.availability.deleteMany(),
    prisma.workPhoto.deleteMany(),
    prisma.subscriptionInvoice.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.subscriptionPlan.deleteMany(),
    prisma.craftsmanCertificate.deleteMany(),
    prisma.craftsmanSkill.deleteMany(),
    prisma.craftsmanCategory.deleteMany(),
    prisma.serviceArea.deleteMany(),
    prisma.craftsmanProfile.deleteMany(),
    prisma.clientProfile.deleteMany(),
    prisma.adminProfile.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.address.deleteMany(),
    prisma.category.deleteMany(),
    prisma.materialSupplier.deleteMany(),
    prisma.materialProduct.deleteMany(),
  ]);

  const hashedPassword = await bcrypt.hash('Test1234!', 12);

  // ============================================================
  // CATEGORIES (Gewerke)
  // ============================================================
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Bathroom Renovation', nameDe: 'Badezimmer Renovierung', slug: 'badezimmer-renovierung', description: 'Komplette Badsanierung und Neubau', iconUrl: '/icons/bathroom.svg', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Roofing', nameDe: 'Dachdeckerarbeiten', slug: 'dachdecker', description: 'Dachdeckung, Reparatur und Dämmung', iconUrl: '/icons/roofing.svg', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Flooring', nameDe: 'Bodenbelagsarbeiten', slug: 'bodenbelag', description: 'Parkett, Fliesen, Laminat und Estrich', iconUrl: '/icons/flooring.svg', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Electrical', nameDe: 'Elektroinstallationen', slug: 'elektro', description: 'Elektroinstallation, Smart Home und Sicherheit', iconUrl: '/icons/electrical.svg', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Plumbing', nameDe: 'Sanitärinstallationen', slug: 'sanitaer', description: 'Rohrleitungen, Heizung und Sanitäranlagen', iconUrl: '/icons/plumbing.svg', sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Painting', nameDe: 'Malerarbeiten', slug: 'maler', description: 'Innen- und Außenanstriche, Tapezierarbeiten', iconUrl: '/icons/painting.svg', sortOrder: 6 } }),
    prisma.category.create({ data: { name: 'Carpentry', nameDe: 'Zimmererarbeiten', slug: 'zimmerer', description: 'Holzbau, Dachstühle und Fachwerk', iconUrl: '/icons/carpentry.svg', sortOrder: 7 } }),
    prisma.category.create({ data: { name: 'Masonry', nameDe: 'Maurerarbeiten', slug: 'maurer', description: 'Mauerwerk, Betonbau und Putzarbeiten', iconUrl: '/icons/masonry.svg', sortOrder: 8 } }),
    prisma.category.create({ data: { name: 'Facade', nameDe: 'Fassadenarbeiten', slug: 'fassade', description: 'Fassadendämmung, Verkleidung und Putz', iconUrl: '/icons/facade.svg', sortOrder: 9 } }),
    prisma.category.create({ data: { name: 'Heating & HVAC', nameDe: 'Heizung & Klima', slug: 'heizung-klima', description: 'Heizungsbau, Klimaanlagen und Lüftung', iconUrl: '/icons/hvac.svg', sortOrder: 10 } }),
    prisma.category.create({ data: { name: 'Drywall', nameDe: 'Trockenbau', slug: 'trockenbau', description: 'Gipskartonplatten, Trennwände und Decken', iconUrl: '/icons/drywall.svg', sortOrder: 11 } }),
    prisma.category.create({ data: { name: 'Windows & Doors', nameDe: 'Fenster & Türen', slug: 'fenster-tueren', description: 'Fensterbau, Türen und Rolläden', iconUrl: '/icons/windows.svg', sortOrder: 12 } }),
  ]);

  console.log(`  ✓ ${categories.length} categories created`);

  // ============================================================
  // USERS
  // ============================================================
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bauimperium.de',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'Bauimperium',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  await prisma.adminProfile.create({ data: { userId: adminUser.id, role: 'SUPER_ADMIN' } });

  // Craftsmen
  const craftsmenData = [
    { email: 'm.schmidt@bauprofi.de', firstName: 'Markus', lastName: 'Schmidt', company: 'Schmidt Bau GmbH', foundedYear: 2005, employeeCount: 25, description: 'Ihr zuverlässiger Partner für hochwertige Badsanierungen und Fliesenarbeiten im Großraum München. Über 15 Jahre Erfahrung.' },
    { email: 's.wagner@handwerk.de', firstName: 'Stefan', lastName: 'Wagner', company: 'Wagner Dachtechnik', foundedYear: 2010, employeeCount: 12, description: 'Spezialist für Dachdeckung, Dämmung und Photovoltaik. Meisterbetrieb seit 2010.' },
    { email: 'l.weber@elektro.de', firstName: 'Lukas', lastName: 'Weber', company: 'Weber Elektrotechnik', foundedYear: 2018, employeeCount: 8, description: 'Moderne Elektroinstallationen, Smart Home und Sicherheitstechnik. Zertifiziert nach DIN VDE.' },
    { email: 'a.fischer@gmx.de', firstName: 'Anna', lastName: 'Fischer', company: 'Fischer Malerbetrieb', foundedYear: 2015, employeeCount: 5, description: 'Maler- und Lackierarbeiten mit höchsten Ansprüchen an Qualität und Termintreue.' },
  ];

  const craftsmen = [];
  for (const c of craftsmenData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: hashedPassword,
        firstName: c.firstName,
        lastName: c.lastName,
        role: 'CRAFTSMAN',
        phone: `+49 89 ${Math.floor(Math.random() * 900000) + 100000}`,
        isVerified: true,
      },
    });

    const address = await prisma.address.create({
      data: {
        street: c.company === 'Schmidt Bau GmbH' ? 'Industriestraße' : 'Musterstraße',
        houseNumber: String(Math.floor(Math.random() * 50) + 1),
        city: 'München',
        postalCode: '80' + String(Math.floor(Math.random() * 100)).padStart(2, '0'),
        country: 'DE',
      },
    });

    const profile = await prisma.craftsmanProfile.create({
      data: {
        userId: user.id,
        companyName: c.company,
        description: c.description,
        foundedYear: c.foundedYear,
        employeeCount: c.employeeCount,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        addressId: address.id,
        annualRevenue: Math.floor(Math.random() * 500000) + 200000,
        creditRating: Math.floor(Math.random() * 200) + 700,
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });

    // Add categories
    if (c.company.includes('Schmidt')) {
      await prisma.craftsmanCategory.create({ data: { craftsmanId: profile.id, categoryId: categories[0].id, isPrimary: true, ratePerHour: 95 } });
      await prisma.craftsmanCategory.create({ data: { craftsmanId: profile.id, categoryId: categories[2].id, ratePerHour: 75 } });
    }
    if (c.company.includes('Dach')) {
      await prisma.craftsmanCategory.create({ data: { craftsmanId: profile.id, categoryId: categories[1].id, isPrimary: true, ratePerHour: 110 } });
    }
    if (c.company.includes('Elektro')) {
      await prisma.craftsmanCategory.create({ data: { craftsmanId: profile.id, categoryId: categories[3].id, isPrimary: true, ratePerHour: 85 } });
    }
    if (c.company.includes('Maler')) {
      await prisma.craftsmanCategory.create({ data: { craftsmanId: profile.id, categoryId: categories[5].id, isPrimary: true, ratePerHour: 55 } });
    }

    // Add availability
    for (let day = 1; day <= 5; day++) {
      await prisma.availability.create({
        data: { craftsmanId: profile.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00' },
      });
    }

    craftsmen.push(profile);
  }

  console.log(`  ✓ ${craftsmen.length} craftsmen created`);

  // Clients
  const clientsData = [
    { email: 'thomas.mueller@gmail.com', firstName: 'Thomas', lastName: 'Müller' },
    { email: 'sarah.klein@web.de', firstName: 'Sarah', lastName: 'Klein' },
    { email: 'david.hoffmann@outlook.com', firstName: 'David', lastName: 'Hoffmann' },
  ];

  const clients = [];
  for (const c of clientsData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: hashedPassword,
        firstName: c.firstName,
        lastName: c.lastName,
        role: 'CLIENT',
        phone: `+49 89 ${Math.floor(Math.random() * 900000) + 100000}`,
        isVerified: true,
      },
    });

    const profile = await prisma.clientProfile.create({
      data: {
        userId: user.id,
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
      },
    });

    clients.push(profile);
  }

  console.log(`  ✓ ${clients.length} clients created`);

  // ============================================================
  // SUBSCRIPTION PLANS
  // ============================================================
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        nameDe: 'Kostenlos',
        slug: 'free',
        description: 'Basis-Features für den Einstieg',
        features: { projectLimit: 5, invoiceLimit: 10, aiAccess: false, erpIntegration: false, teamManagement: false },
        priceMonthly: 0,
        maxUsers: 1,
        maxProjects: 5,
        maxInvoices: 10,
        includesAi: false,
        includesEscrow: false,
        sortOrder: 1,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Business',
        nameDe: 'Business',
        slug: 'business',
        description: 'Für wachsende Handwerksbetriebe mit KI-Unterstützung',
        features: { projectLimit: 100, invoiceLimit: -1, aiAccess: true, erpIntegration: true, teamManagement: false },
        priceMonthly: 199,
        maxUsers: 3,
        maxProjects: 100,
        includesAi: true,
        includesEscrow: true,
        includesErp: true,
        sortOrder: 2,
        isPopular: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        nameDe: 'Enterprise',
        slug: 'enterprise',
        description: 'Komplettlösung für große Betriebe mit Team-Management',
        features: { projectLimit: -1, invoiceLimit: -1, aiAccess: true, erpIntegration: true, teamManagement: true, apiAccess: true },
        priceMonthly: 499,
        maxUsers: 20,
        includesAi: true,
        includesEscrow: true,
        includesErp: true,
        includesTeam: true,
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`  ✓ ${plans.length} subscription plans created`);

  // ============================================================
  // MATERIAL SUPPLIERS
  // ============================================================
  const suppliers = await Promise.all([
    prisma.materialSupplier.create({
      data: {
        name: 'Bauhaus AG',
        slug: 'bauhaus',
        description: 'Führender Baustoffhändler mit über 200 Filialen',
        logoUrl: '/logos/bauhaus.svg',
        website: 'https://www.bauhaus.info',
        commissionRate: 0.05,
      },
    }),
    prisma.materialSupplier.create({
      data: {
        name: 'Hornbach',
        slug: 'hornbach',
        description: 'Baumarkt und Baustoffhandel',
        logoUrl: '/logos/hornbach.svg',
        website: 'https://www.hornbach.de',
        commissionRate: 0.045,
      },
    }),
    prisma.materialSupplier.create({
      data: {
        name: 'Saint-Gobain',
        slug: 'saint-gobain',
        description: 'Baustoffhersteller und -lieferant',
        logoUrl: '/logos/saint-gobain.svg',
        website: 'https://www.saint-gobain.de',
        commissionRate: 0.04,
      },
    }),
  ]);

  // Products
  const products = [
    { name: 'Zement Estrich', category: 'Estrich', unitPrice: 12.50, unit: 'Sack', supplierId: suppliers[0].id },
    { name: 'Gipskartonplatte', category: 'Trockenbau', unitPrice: 8.90, unit: 'Stk', supplierId: suppliers[0].id },
    { name: 'Fliesenkleber Flex', category: 'Fliesen', unitPrice: 15.30, unit: 'Sack', supplierId: suppliers[0].id },
    { name: 'Wärmedämmverbundsystem', category: 'Dämmung', unitPrice: 45.00, unit: 'm²', supplierId: suppliers[1].id },
    { name: 'Dachziegel Tondach', category: 'Dach', unitPrice: 3.80, unit: 'Stk', supplierId: suppliers[1].id },
    { name: 'Installationsrohr', category: 'Sanitär', unitPrice: 4.50, unit: 'm', supplierId: suppliers[2].id },
    { name: 'Elektrokabel NYM 3x1,5', category: 'Elektro', unitPrice: 1.20, unit: 'm', supplierId: suppliers[2].id },
    { name: 'Innenfarbe Weiß', category: 'Farbe', unitPrice: 34.90, unit: 'Eimer', supplierId: suppliers[0].id },
  ];

  for (const p of products) {
    await prisma.materialProduct.create({
      data: { ...p, sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 8)}` },
    });
  }

  console.log(`  ✓ ${suppliers.length} suppliers with ${products.length} products created`);

  // ============================================================
  // SAMPLE PROJECTS
  // ============================================================
  const projectsData = [
    {
      title: 'Badezimmer Komplettsanierung im Altbau',
      description: 'Unser Badezimmer (ca. 12m²) soll komplett saniert werden. Alte Fliesen raus, neue Leitungen, moderne Dusche und Doppelwaschbecken. Fußbodenheizung wäre wünschenswert. Die Wohnung befindet sich im 3. Stock ohne Aufzug.',
      categoryId: categories[0].id,
      clientId: clients[0].id,
      budgetMin: 15000,
      budgetMax: 25000,
      squareMeters: 12,
      isUrgent: true,
      status: 'PUBLISHED',
    },
    {
      title: 'Dachsanung inkl. Dämmung Einfamilienhaus',
      description: 'Einfamilienhaus Baujahr 1985, Dachfläche ca. 150m². Aktuelle Ziegel sind porös, es regnet teilweise durch. Wir möchten eine Komplettsanung mit Aufsparrendämmung und ggf. Photovoltaik-Vorbereitung.',
      categoryId: categories[1].id,
      clientId: clients[1].id,
      budgetMin: 35000,
      budgetMax: 55000,
      squareMeters: 150,
      isUrgent: false,
      status: 'PUBLISHED',
    },
    {
      title: 'Terrasse fliesen (ca. 25m²) in München Bogenhausen',
      description: 'Unsere Terrassenfläche soll neu gefliest werden. Der Untergrund ist bereits vorbereitet (Betonboden). Gewünscht werden großformatige Feinsteinzeugfliesen (60x60cm). Inkl. Sockelleisten.',
      categoryId: categories[2].id,
      clientId: clients[2].id,
      budgetMin: 3500,
      budgetMax: 6000,
      squareMeters: 25,
      isUrgent: false,
      status: 'PUBLISHED',
    },
  ];

  const projects = [];
  for (const p of projectsData) {
    const address = await prisma.address.create({
      data: {
        street: 'Beispielstraße',
        houseNumber: String(Math.floor(Math.random() * 100) + 1),
        city: 'München',
        postalCode: ['80331', '80339', '80469', '80538', '80636', '80796', '80803', '80992'][Math.floor(Math.random() * 8)],
        country: 'DE',
      },
    });

    const project = await prisma.project.create({
      data: {
        ...p,
        addressId: address.id,
        status: 'PUBLISHED',
        startDatePreferred: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDatePreferred: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });

    projects.push(project);
  }

  console.log(`  ✓ ${projects.length} sample projects created`);

  // ============================================================
  // AI ANALYSES FOR PROJECTS
  // ============================================================
  for (const project of projects) {
    await prisma.aIAnalysis.create({
      data: {
        projectId: project.id,
        rawInput: project.description,
        rawInputType: 'TEXT',
        confidence: 0.85 + Math.random() * 0.1,
        resultSpecs: [
          { key: 'area_sqm', value: String(project.squareMeters || 25), unit: 'm²', confidence: 0.9 },
          { key: 'material_quality', value: 'Standard', confidence: 0.75 },
        ],
        estimatedCosts: { min: project.budgetMin, max: project.budgetMax, currency: 'EUR', confidence: 0.8 },
        estimatedDuration: { min: 5, max: 21, unit: 'days' },
        dinNormReferences: ['DIN 18352', 'DIN 18157'],
        requiredMaterials: [
          { name: 'Fliesen', estimatedQuantity: '25', unit: 'm²' },
          { name: 'Kleber', estimatedQuantity: '50', unit: 'kg' },
        ],
      },
    });
  }

  // ============================================================
  // COMPLETED PROJECT WITH REVIEW
  // ============================================================
  const completedAddress = await prisma.address.create({
    data: { street: 'Musterweg', houseNumber: '10', city: 'München', postalCode: '80335', country: 'DE' },
  });

  const completedProject = await prisma.project.create({
    data: {
      clientId: clients[0].id,
      title: 'Wohnzimmer tapezieren und streichen',
      description: 'Wohnzimmer (35m²) neu tapezieren und streichen. Raufaser entfernen, neue Glattvliestapete und weiße Farbe.',
      categoryId: categories[5].id,
      addressId: completedAddress.id,
      budgetMin: 2000,
      budgetMax: 3500,
      status: 'COMPLETED',
      startDatePreferred: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDatePreferred: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Assignment for completed project
  const assignment = await prisma.projectAssignment.create({
    data: {
      projectId: completedProject.id,
      craftsmanId: craftsmen[3].id, // Anna Fischer
      status: 'COMPLETED',
      acceptedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      craftsmanRating: 5,
      clientRating: 5,
    },
  });

  // Review
  await prisma.review.create({
    data: {
      projectId: completedProject.id,
      authorId: clients[0].id,
      craftsmanId: craftsmen[3].id,
      rating: 5,
      title: 'Perfekte Arbeit!',
      description: 'Sehr saubere Arbeit, alles pünktlich und zu einem fairen Preis. Gerne wieder!',
      isVerified: true,
    },
  });

  console.log(`  ✓ Sample completed project with review created`);
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Seeding completed!');
  console.log('  Login credentials:');
  console.log('  Email: admin@bauimperium.de');
  console.log('  Password: Test1234!');
  console.log('  (All accounts use this password)');
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
