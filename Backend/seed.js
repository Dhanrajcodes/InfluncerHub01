//backend/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import InfluencerProfile from './models/InfluencerProfile.js';
import BrandProfile from './models/BrandProfile.js';
import Sponsorship from './models/Sponsorship.js';
import Category from './models/Category.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/influencerhub';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await BrandProfile.deleteMany({});
  await InfluencerProfile.deleteMany({});
  await Sponsorship.deleteMany({});
  await Category.deleteMany({});

  // Create categories
  const fitnessCategory = await Category.create({ name: 'Fitness' });
  const lifestyleCategory = await Category.create({ name: 'Lifestyle' });

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const sponsorPassword = await bcrypt.hash('password', salt);
  const influencerPassword = await bcrypt.hash('password', salt);

  // Create demo sponsor
  const sponsor = await User.create({
    name: 'Demo Sponsor',
    email: 'sponsor@example.com',
    password: sponsorPassword,
    role: 'brand',
  });

  const brandProfile = await BrandProfile.create({
    user: sponsor._id,
    companyName: 'Demo Sponsor Co',
    industry: 'Fitness',
    contactEmail: 'partnerships@demosponsor.com',
    description: 'Demo brand profile for testing brand mode.',
    budgetPerPost: 5000,
  });

  // Create demo influencer
  const influencerUser = await User.create({
    name: 'Demo Influencer',
    email: 'influencer@example.com',
    password: influencerPassword,
    role: 'influencer',
  });

  // Create influencer profile
  const influencerProfile = await InfluencerProfile.create({
    user: influencerUser._id,
    handle: 'demoinfluencer',
    bio: 'Fitness and lifestyle influencer',
    categories: [fitnessCategory._id, lifestyleCategory._id],
    followerCount: 10000,
    socialLinks: {
      instagram: 'https://instagram.com/demo',
      youtube: 'https://www.youtube.com/demochannel',
      tiktok: 'https://www.tiktok.com/@demotiktok',
      twitter: 'https://twitter.com/demotwitter',
    },
    portfolio: [
      'https://res.cloudinary.com/dp6iibt2h/image/upload/v1700000000/influencer_hub_avatars/portfolio-1.jpg',
      'https://res.cloudinary.com/dp6iibt2h/image/upload/v1700000000/influencer_hub_avatars/portfolio-2.jpg',
      'https://res.cloudinary.com/dp6iibt2h/image/upload/v1700000000/influencer_hub_avatars/portfolio-3.jpg',
    ],
  });

  // Create sponsorship
  await Sponsorship.create({
    title: 'Demo Sponsorship',
    brand: brandProfile._id,
    influencer: influencerProfile._id,
    status: 'pending',
    description: 'Demo campaign for fitness product',
    budget: 5000,
  });

  console.log('Demo data seeded!');
  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
