import { connectToDatabase } from './mongodb';
import { User, IUser } from '@/models/User';

export async function getAuthenticatedUser(): Promise<IUser> {
  await connectToDatabase();

  const defaultEmail = 'player1@gamelog.gg';
  let user = await User.findOne({ email: defaultEmail });

  if (!user) {
    user = await User.create({
      email: defaultEmail,
      name: 'Player One',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
    });
  }

  return user;
}
