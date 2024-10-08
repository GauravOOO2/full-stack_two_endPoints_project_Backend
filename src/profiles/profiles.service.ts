import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Profile } from '@prisma/client';
import { CreateProfileDto } from '../users/dto/create-profile.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Profile[]> {
    return this.prisma.profile.findMany();
  }

  async findOneByUserId(userId: number): Promise<Profile & { user: { username: string } }> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }

    return profile;
  }

  async create(createProfileDto: CreateProfileDto) {
    const { userId, ...profileData } = createProfileDto;
    return this.prisma.profile.create({
      data: {
        ...profileData,
        user: { connect: { id: userId } },
      },
      include: { user: true },
    });
  }

  async createOrUpdateProfile(createProfileDto: CreateProfileDto): Promise<Profile & { user: { username: string } }> {
    try {
      const { userId, username, ...profileData } = createProfileDto;

      const result = await this.prisma.profile.upsert({
        where: { userId: userId },
        update: {
          ...profileData,
          user: {
            update: { username }
          }
        },
        create: {
          ...profileData,
          user: {
            connect: { id: userId },
          }
        },
        include: { user: true }
      });

      return {
        ...result,
        user: { username: result.user.username }
      };
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      throw new InternalServerErrorException('Failed to create or update profile');
    }
  }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    const { username, ...profileData } = updateProfileDto;
    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...profileData,
        user: username ? { update: { username } } : undefined,
      },
      include: { user: true },
    });
  }

  async updateProfile(userId: number, profileData: UpdateProfileDto) {
    const { username, ...profileUpdateData } = profileData;
    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...profileUpdateData,
        user: username ? {
          update: { username }
        } : undefined
      },
    });
  }

  async removeByUserId(userId: number): Promise<Profile> {
    const existingProfile = await this.prisma.profile.findUnique({ where: { userId } });

    if (!existingProfile) {
      throw new NotFoundException(`Profile for user with ID ${userId} not found`);
    }

    return this.prisma.profile.delete({
      where: { userId },
    });
  }

  updateProfileByUserId(userId: number, updateProfileDto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        user: { connect: { id: userId } },
        email: updateProfileDto.email,
        gender: updateProfileDto.gender,
        address: updateProfileDto.address,
        pincode: updateProfileDto.pincode,
        city: updateProfileDto.city,
        state: updateProfileDto.state,
        country: updateProfileDto.country,
      },
    });
  }
}
