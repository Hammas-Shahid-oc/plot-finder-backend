import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';

@Injectable()
export class SeedService {
  constructor(private readonly userService: UserService) {}

  async seedUsers() {
    try {
      // Check if test user already exists
      const existingUser =
        await this.userService.findByEmail('test@example.com');

      if (!existingUser) {
        // Create a test user
        const user = await this.userService.createUser(
          'test@example.com',
          'password123',
          'Test',
          'User',
        );
        console.log('✅ Test user created successfully:', user.email);
        console.log('   Email: test@example.com');
        console.log('   Password: password123');
        return user;
      } else {
        console.log('ℹ️  Test user already exists');
        return existingUser;
      }
    } catch (error) {
      console.error('❌ Error seeding users:', error.message);
      throw error;
    }
  }
}

