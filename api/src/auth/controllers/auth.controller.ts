import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CredentialsDto } from '../dtos/credentials.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthDto } from '../dtos/auth.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { MessageDto } from '../dtos/message.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { RegisterDto } from '../dtos/register.dto';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({
    description: 'User credentials were verified successfully',
    type: AuthDto
  })
  @ApiUnauthorizedResponse({
    description: 'A user account unverified'
  })
  async login(@Body() credentials: CredentialsDto): Promise<AuthDto> {
    return this.authService.login(
      credentials.emailAddress,
      credentials.password
    );
  }

  @Post('register')
  @ApiCreatedResponse({
    description: 'User account created successfully',
    type: AuthDto
  })
  @ApiConflictResponse({
    description: 'A user account exists with the provided email'
  })
  async register(@Body() payload: RegisterDto): Promise<AuthDto> {
    return this.authService.register(
      payload.fullName,
      payload.emailAddress,
      payload.password
    );
  }

  @Post('forgot-password')
  @ApiOkResponse({
    description: 'Password reset email dispatched',
    type: MessageDto
  })
  async forgotPassword(
    @Body() payload: ForgotPasswordDto
  ): Promise<MessageDto> {
    await this.authService.forgotPassword(payload.emailAddress);
    return {
      message: 'A reset code has been sent to your email address.'
    };
  }

  @Post('reset-password')
  @ApiOkResponse({
    description: 'Password reset completed successfully',
    type: MessageDto
  })
  @ApiBadRequestResponse({
    description: 'The provided reset code did not match'
  })
  @ApiNotFoundResponse({
    description: 'A user account does not exist for the provided email'
  })
  async resetPassword(@Body() payload: ResetPasswordDto): Promise<MessageDto> {
    await this.authService.resetPassword(
      payload.emailAddress,
      payload.resetCode,
      payload.password
    );
    return {
      message: 'Password reset successful.'
    };
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: MessageDto
  })
  @ApiBadRequestResponse({
    description: 'The provided verification code was invalid'
  })
  @ApiNotFoundResponse({
    description: 'A user account does not exist for the provided user details'
  })
  async verifyEmail(
    @Request() req,
    @Body() payload: VerifyEmailDto
  ): Promise<MessageDto> {
    const userId = req.user.id;
    await this.authService.verifyEmail(userId, payload.verificationCode);

    return {
      message: 'Email verification successful.'
    };
  }

  @Post('resend-verification-code')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Email sent successfully',
    type: MessageDto
  })
  @ApiNotFoundResponse({
    description: 'A user account does not exist for the provided user details'
  })
  async resendVerification(@Request() req): Promise<MessageDto> {
    const userId = req.user.id;
    await this.authService.resendVerificationCode(userId);

    return {
      message: 'Verification code successfully resent.'
    };
  }
}
