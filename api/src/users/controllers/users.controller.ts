import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserProfileDto } from '../dtos/user-profile.dto';
import { UsersService } from '../services/users.service';
import { PasswordUpdateDto } from '../dtos/password-update.dto';
import { MessageDto } from '../../auth/dtos/message.dto';
import { User } from '../schemas/user.schema';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@Controller('v1/users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('current')
  async getCallerProfile(@Request() req): Promise<User> {
    const userId = req.user.id;
    return await this.userService.findById(userId);
  }

  @Put('current')
  async updateCallerProfile(@Request() req, @Body() payload: UserProfileDto) {
    const userId = req.user.id;
    return await this.userService.update(userId, payload);
  }

  @Put('current/passwords')
  @ApiOkResponse({
    description: 'Password updated',
    type: MessageDto
  })
  @ApiNotFoundResponse({
    description: 'A user account not found'
  })
  @ApiBadRequestResponse({
    description: 'Current password mismatch'
  })
  async updateCallerPassword(
    @Request() req,
    @Body() payload: PasswordUpdateDto
  ): Promise<MessageDto> {
    const userId = req.user.id;
    await this.userService.updatePassword(
      userId,
      payload.currentPassword,
      payload.newPassword
    );

    return {
      message: 'Password updated successfully.'
    };
  }
}
